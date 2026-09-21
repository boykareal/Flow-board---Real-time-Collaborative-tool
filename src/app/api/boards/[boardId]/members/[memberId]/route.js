import { NextResponse } from "next/server";
import { db, boardsId, cardsId } from "@/models/name";
import { Client, Databases, Account, Query } from "node-appwrite";

export async function DELETE(request, {params}){
    try {
        const { boardId, memberId } = await params;

        if(typeof memberId !== "string" || !memberId.trim()){
            return NextResponse.json({error: "MemberId is required"},{status:400})
        }

        if(typeof boardId !== "string" || !boardId.trim()){
            return NextResponse.json({error: "BoardId is required"},{status:400})
        }

        const authHeader = request.headers.get("authorization");

        if (!authHeader?.startsWith("Bearer ")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const jwt = authHeader.slice(7).trim();
        
        if (!jwt) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userClient = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
          .setJWT(jwt);

        const account = new Account(userClient);
        const serverClient = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
          .setKey(process.env.APPWRITE_API_KEY);
        const serverDatabases = new Databases(serverClient);

        const user = await account.get();

        const board = await serverDatabases.getDocument(db, boardsId, boardId);

        const members = Array.isArray(board.members) ? board.members : [];

        const memberRoles = Array.isArray(board.memberRoles)
          ? board.memberRoles
          : [];

        const requesterIndex = members.indexOf(user.$id);

        if (requesterIndex === -1) {
          return NextResponse.json(
            { error: "You are not a member of this board" },
            { status: 403 },
          );
        }

        const requesterRole = memberRoles[requesterIndex];

        if (requesterRole !== "owner") {
          return NextResponse.json(
            { error: "Only the board owner can remove members" },
            { status: 403 },
          );
        }

        const memberIndex = members.indexOf(memberId);

        if (memberIndex === -1) {
          return NextResponse.json(
            { error: "Member is not part of this board" },
            { status: 404 },
          );
        }

        const targetRole = memberRoles[memberIndex];

        if (targetRole === "owner") {
          return NextResponse.json(
            { error: "Board owners cannot be removed" },
            { status: 403 },
          );
        }

        const assignedCards = await serverDatabases.listDocuments(db, cardsId, [
          Query.equal("boardId", boardId),
          Query.equal("assigneeId", memberId),
        ]);

        await Promise.all(
          assignedCards.documents.map((card) =>
            serverDatabases.updateDocument(db, cardsId, card.$id, {
              assigneeId: "",
            }),
          ),
        );

        const updatedMembers = members.filter(
          (_, index) => index !== memberIndex,
        );

        const updatedRoles = memberRoles.filter(
          (_, index) => index !== memberIndex,
        );

        await serverDatabases.updateDocument(
          db,
          boardsId,
          boardId,
          {
            members: updatedMembers,
            memberRoles: updatedRoles,
          },
        );

        return NextResponse.json({
          message: "Member removed successfully",
          members: updatedMembers,
          memberRoles: updatedRoles,
        });

    } catch (error) {
        console.error("Remove member failed:", error);

        if (error instanceof SyntaxError) {
          return NextResponse.json(
            { error: "Invalid request." },
            { status: 400 },
          );
        }

        const status =
          Number.isInteger(error?.code) && error.code >= 400 && error.code < 500
            ? error.code
            : 500;

        return NextResponse.json(
          {
            error:
              status === 500
                ? "Unable to remove member. Please try again."
                : error?.message ?? "Unable to remove member.",
          },
          { status },
        );
    }
}
