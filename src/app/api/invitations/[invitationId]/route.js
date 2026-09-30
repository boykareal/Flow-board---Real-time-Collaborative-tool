import { NextResponse } from "next/server";
import { Account, Client, Databases, Permission, Query, Role } from "node-appwrite";
import { boardsId, cardsId, columnsId, db, invitationsId } from "@/models/name";

export async function PATCH(request, { params }) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { invitationId } = await params;
    const { action } = await request.json();
    if (!["accept", "decline"].includes(action)) return NextResponse.json({ error: "Choose accept or decline" }, { status: 400 });
    const userClient = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setJWT(authorization.slice(7).trim());
    const user = await new Account(userClient).get();
    const adminClient = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(adminClient);
    const invitation = await databases.getDocument(db, invitationsId, invitationId);
    if (invitation.recipientId !== user.$id || invitation.status !== "pending") return NextResponse.json({ error: "This invitation is unavailable" }, { status: 403 });

    if (action === "accept") {
      const board = await databases.getDocument(db, boardsId, invitation.boardId);
      const members = Array.isArray(board.members) ? board.members : [];
      const roles = Array.isArray(board.memberRoles) ? board.memberRoles : [];
      if (!members.includes(user.$id)) {
        members.push(user.$id);
        roles.push("viewer");
        await databases.updateDocument(db, boardsId, board.$id, { members, memberRoles: roles }, [
          ...(board.$permissions ?? []), Permission.read(Role.user(user.$id)),
        ]);
        const [columns, cards] = await Promise.all([
          databases.listDocuments(db, columnsId, [Query.equal("boardId", board.$id), Query.limit(500)]),
          databases.listDocuments(db, cardsId, [Query.equal("boardId", board.$id), Query.limit(500)]),
        ]);
        await Promise.all([
          ...columns.documents.map((document) => databases.updateDocument(db, columnsId, document.$id, {}, [...(document.$permissions ?? []), Permission.read(Role.user(user.$id))])),
          ...cards.documents.map((document) => databases.updateDocument(db, cardsId, document.$id, {}, [...(document.$permissions ?? []), Permission.read(Role.user(user.$id))])),
        ]);
      }
    }

    await databases.updateDocument(db, invitationsId, invitationId, { status: action === "accept" ? "accepted" : "declined" });
    return NextResponse.json({ message: action === "accept" ? "Invitation accepted" : "Invitation declined" });
  } catch (error) {
    const status = Number.isInteger(error?.code) && error.code >= 400 && error.code < 500 ? error.code : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to update invitation." : error.message }, { status });
  }
}
