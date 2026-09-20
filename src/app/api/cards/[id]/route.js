import { NextResponse } from "next/server";
import { Client, Databases, Account } from "node-appwrite";
import { db, cardsId, columnsId, boardsId } from "@/models/name";

export async function PATCH(request, { params }){
   try {
     const { id } = await params;

     if (typeof id !== "string" || !id.trim()) {
       return NextResponse.json({ error: "Card id is required" }, { status: 400 });
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
     const databases = new Databases(serverClient);

     const user = await account.get();

     const card = await databases.getDocument(
       db,
       cardsId,
       id,
     );

     const column = await databases.getDocument(
      db,
      columnsId,
      card.columnId,
     );

     const board = await databases.getDocument(
      db,
      boardsId,
      column.boardId,
     );

     const memberIndex = board.members?.indexOf(user.$id) ?? -1;

     if (memberIndex === -1) {
       return NextResponse.json(
         { error: "You are not a member of this board" },
         { status: 403 },
       );
     }

     const role = board.memberRoles?.[memberIndex];

     if (role !== "owner" && role !== "editor") {
       return NextResponse.json(
         { error: "You do not have permission to update this card" },
         { status: 403 },
       );
     }

     const body = await request.json();
     const { title, description, assigneeId, columnId, order } = body ?? {};

     const hasColumnId = columnId !== undefined;
     const hasOrder = order !== undefined;

     if (hasColumnId !== hasOrder) {
       return NextResponse.json(
         { error: "Column id and order must be provided together" },
         { status: 400 },
       );
     }

     if (hasColumnId && (typeof columnId !== "string" || !columnId.trim())) {
       return NextResponse.json(
         { error: "Column id must be a valid string" },
         { status: 400 },
       );
     }

     if (hasOrder && (!Number.isInteger(order) || order < 0)) {
       return NextResponse.json(
         { error: "Order must be a non-negative integer" },
         { status: 400 },
       );
     }

     if (
       title !== undefined &&
       (typeof title !== "string" || title.trim().length < 6)
     ) {
       return NextResponse.json(
         { error: "Title must be at least 6 characters long" },
         { status: 400 },
       );
     }

     if (description !== undefined && typeof description !== "string") {
       return NextResponse.json(
         { error: "Description must be text" },
         { status: 400 },
       );
     }

     if (assigneeId !== undefined && typeof assigneeId !== "string") {
       return NextResponse.json(
         { error: "Assignee id must be text" },
         { status: 400 },
       );
     }

     const updateData = {};

     if (title !== undefined) {
       updateData.title = title.trim();
     }

     if (description !== undefined) {
       updateData.description = description;
     }

     if (assigneeId !== undefined) {
       updateData.assigneeId = assigneeId;
     }

     if (hasColumnId) {
       const targetColumn = await databases.getDocument(
         db,
         columnsId,
         columnId.trim(),
       );

       if (targetColumn.boardId !== board.$id) {
         return NextResponse.json(
           { error: "Target column does not belong to this board" },
           { status: 403 },
         );
       }

       updateData.columnId = columnId.trim();
       updateData.order = order;
     }

     if (Object.keys(updateData).length === 0) {
       return NextResponse.json(
         { error: "No card changes were provided" },
         { status: 400 },
       );
     }

     const updatedCard = await databases.updateDocument(
       db,
       cardsId,
       id,
       updateData,
     );

     return NextResponse.json(updatedCard, { status: 200 });
   } catch (error) {
     console.error("Error updating card:", error);

     const status =
       Number.isInteger(error?.code) && error.code >= 400 && error.code < 500
         ? error.code
         : 500;

     return NextResponse.json(
       {
         error:
           status === 500
             ? "Failed to update card"
             : error?.message ?? "Unable to update card",
       },
       { status },
     );
   }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json({ error: "Card id is required" }, { status: 400 });
    }

    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const jwt = authorization.slice(7).trim();
    if (!jwt) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setJWT(jwt);
    const user = await new Account(userClient).get();

    const serverClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(serverClient);

    const card = await databases.getDocument(db, cardsId, id);
    const column = await databases.getDocument(db, columnsId, card.columnId);
    const board = await databases.getDocument(db, boardsId, column.boardId);
    const members = Array.isArray(board.members) ? board.members : [];
    const memberRoles = Array.isArray(board.memberRoles) ? board.memberRoles : [];
    const memberIndex = members.indexOf(user.$id);

    if (memberIndex === -1) {
      return NextResponse.json(
        { error: "You are not a member of this board" },
        { status: 403 },
      );
    }

    if (memberRoles[memberIndex] !== "owner" && memberRoles[memberIndex] !== "editor") {
      return NextResponse.json(
        { error: "You do not have permission to delete this card" },
        { status: 403 },
      );
    }

    await databases.deleteDocument(db, cardsId, id);
    return NextResponse.json({ message: "Card deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting card:", error);
    const status =
      Number.isInteger(error?.code) && error.code >= 400 && error.code < 500
        ? error.code
        : 500;
    return NextResponse.json(
      { error: status === 500 ? "Failed to delete card" : error?.message ?? "Unable to delete card" },
      { status },
    );
  }
}
