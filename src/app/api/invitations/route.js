import { NextResponse } from "next/server";
import { Account, Client, Databases, ID, Permission, Query, Role, Users } from "node-appwrite";
import { boardsId, db, invitationsId, profilesId } from "@/models/name";

function clients(jwt) {
  const userClient = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setJWT(jwt);
  const adminClient = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
  return { userClient, databases: new Databases(adminClient), users: new Users(adminClient) };
}

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { userClient, databases } = clients(authorization.slice(7).trim());
    const user = await new Account(userClient).get();
    const result = await databases.listDocuments(db, invitationsId, [
      Query.equal("recipientId", user.$id), Query.equal("status", "pending"), Query.orderDesc("$createdAt"), Query.limit(100),
    ]);
    const invitations = await Promise.all(result.documents.map(async (invitation) => {
      const [board, senderProfile] = await Promise.all([
        databases.getDocument(db, boardsId, invitation.boardId),
        databases.getDocument(db, profilesId, invitation.senderId).catch(() => null),
      ]);
      return { ...invitation, boardTitle: board.title, senderName: senderProfile?.displayName ?? "A FlowBoard user" };
    }));
    return NextResponse.json({ invitations });
  } catch (error) {
    const status = Number.isInteger(error?.code) && error.code >= 400 && error.code < 500 ? error.code : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to load invitations." : error.message }, { status });
  }
}

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { boardId, recipientId } = await request.json();
    if (typeof boardId !== "string" || typeof recipientId !== "string" || !boardId.trim() || !recipientId.trim()) {
      return NextResponse.json({ error: "Board and user are required" }, { status: 400 });
    }
    const { userClient, databases, users } = clients(authorization.slice(7).trim());
    const user = await new Account(userClient).get();
    const board = await databases.getDocument(db, boardsId, boardId);
    const senderIndex = board.members.indexOf(user.$id);
    if (senderIndex < 0 || board.memberRoles?.[senderIndex] !== "owner") return NextResponse.json({ error: "Only the board owner can invite users" }, { status: 403 });
    if (board.members.includes(recipientId)) return NextResponse.json({ error: "This user is already a member" }, { status: 409 });
    await users.get(recipientId);
    const existing = await databases.listDocuments(db, invitationsId, [
      Query.equal("boardId", boardId), Query.equal("recipientId", recipientId), Query.equal("status", "pending"), Query.limit(1),
    ]);
    if (existing.total) return NextResponse.json({ error: "An invitation is already pending" }, { status: 409 });
    const invitation = await databases.createDocument(db, invitationsId, ID.unique(), {
      boardId, senderId: user.$id, recipientId, status: "pending",
    }, [Permission.read(Role.user(recipientId)), Permission.update(Role.user(recipientId)), Permission.read(Role.user(user.$id))]);
    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    const status = Number.isInteger(error?.code) && error.code >= 400 && error.code < 500 ? error.code : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to send invitation." : error.message }, { status });
  }
}
