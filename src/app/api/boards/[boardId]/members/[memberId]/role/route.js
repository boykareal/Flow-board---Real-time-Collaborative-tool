import { NextResponse } from "next/server";
import { Account, Client, Databases } from "node-appwrite";
import { boardsId, db } from "@/models/name";

const validRoles = ["viewer", "editor", "owner"];

export async function PATCH(request, { params }) {
  try {
    const { boardId, memberId } = await params;

    if (!boardId?.trim() || !memberId?.trim()) {
      return NextResponse.json(
        { error: "Board ID and member ID are required" },
        { status: 400 },
      );
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jwt = authHeader.slice(7).trim();
    const { role } = await request.json();

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Role must be viewer, editor, or owner" },
        { status: 400 },
      );
    }

    const userClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setJWT(jwt);

    const account = new Account(userClient);
    const user = await account.get();

    const serverClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const serverDatabases = new Databases(serverClient);
    const board = await serverDatabases.getDocument(db, boardsId, boardId);
    const members = Array.isArray(board.members) ? board.members : [];
    const memberRoles = Array.isArray(board.memberRoles)
      ? board.memberRoles
      : [];

    const requesterIndex = members.indexOf(user.$id);
    const targetIndex = members.indexOf(memberId);

    if (requesterIndex === -1) {
      return NextResponse.json(
        { error: "You are not a member of this board" },
        { status: 403 },
      );
    }

    if (memberRoles[requesterIndex] !== "owner") {
      return NextResponse.json(
        { error: "Only the board owner can change member roles" },
        { status: 403 },
      );
    }

    if (targetIndex === -1) {
      return NextResponse.json(
        { error: "Member is not part of this board" },
        { status: 404 },
      );
    }

    const updatedRoles = [...memberRoles];
    const targetRole = updatedRoles[targetIndex];

    if (targetRole === "owner" && role !== "owner") {
      return NextResponse.json(
        { error: "Transfer ownership to another member before demoting the owner" },
        { status: 400 },
      );
    }

    if (role === "owner") {
      const currentOwnerIndex = updatedRoles.indexOf("owner");

      if (currentOwnerIndex !== -1 && currentOwnerIndex !== targetIndex) {
        updatedRoles[currentOwnerIndex] = "editor";
      }
    }

    updatedRoles[targetIndex] = role;

    const updatedBoard = await serverDatabases.updateDocument(
      db,
      boardsId,
      boardId,
      { memberRoles: updatedRoles },
    );

    return NextResponse.json({
      message: "Member role updated successfully",
      members: updatedBoard.members,
      memberRoles: updatedBoard.memberRoles,
    });
  } catch (error) {
    console.error("Change member role failed:", error);

    const status =
      Number.isInteger(error?.code) && error.code >= 400 && error.code < 500
        ? error.code
        : 500;

    return NextResponse.json(
      {
        error:
          status === 500
            ? "Unable to change member role. Please try again."
            : error?.message ?? "Unable to change member role.",
      },
      { status },
    );
  }
}
