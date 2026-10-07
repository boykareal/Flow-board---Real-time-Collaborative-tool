import { NextResponse } from "next/server";
import { Account, Client, Databases } from "node-appwrite";
import { boardsId, columnsId, db } from "@/models/name";

export async function PATCH(request, { params }) {
  try {
    const { columnId } = await params;
    if (typeof columnId !== "string" || !columnId.trim()) {
      return NextResponse.json({ error: "Column ID is required." }, { status: 400 });
    }

    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const title = (await request.json())?.title;
    if (typeof title !== "string" || title.trim().length < 5 || title.trim().length > 256) {
      return NextResponse.json({ error: "Column name must be between 5 and 256 characters." }, { status: 400 });
    }

    const userClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setJWT(authorization.slice(7).trim());
    const user = await new Account(userClient).get();

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(adminClient);

    const column = await databases.getDocument(db, columnsId, columnId);
    const board = await databases.getDocument(db, boardsId, column.boardId);
    const members = Array.isArray(board.members) ? board.members : [];
    const roles = Array.isArray(board.memberRoles) ? board.memberRoles : [];
    const memberIndex = members.indexOf(user.$id);

    if (memberIndex < 0) {
      return NextResponse.json({ error: "You are not a member of this board." }, { status: 403 });
    }
    if (!["owner", "editor"].includes(roles[memberIndex])) {
      return NextResponse.json({ error: "Only board owners and editors can rename columns." }, { status: 403 });
    }

    const updatedColumn = await databases.updateDocument(db, columnsId, columnId, {
      title: title.trim(),
    });
    return NextResponse.json(updatedColumn);
  } catch (error) {
    console.error("Rename column failed:", error);
    const status = Number.isInteger(error?.code) && error.code >= 400 && error.code < 500
      ? error.code
      : 500;
    return NextResponse.json({
      error: status === 500 ? "Unable to rename column. Please try again." : error.message,
    }, { status });
  }
}
