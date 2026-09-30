import { NextResponse } from "next/server";
import { Account, Client, Databases } from "node-appwrite";
import { boardsId, cardsId, columnsId, db } from "@/models/name";

export async function PATCH(request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setJWT(authorization.slice(7).trim());
    const user = await new Account(userClient).get();
    const { boardId, updates } = await request.json();

    if (typeof boardId !== "string" || !Array.isArray(updates) || updates.length === 0 || updates.length > 500) {
      return NextResponse.json({ error: "A board and card order updates are required" }, { status: 400 });
    }
    if (updates.some(({ id, columnId, order }) =>
      typeof id !== "string" || typeof columnId !== "string" || !Number.isInteger(order) || order < 0,
    )) {
      return NextResponse.json({ error: "Card order updates are invalid" }, { status: 400 });
    }

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(adminClient);
    const board = await databases.getDocument(db, boardsId, boardId);
    const memberIndex = board.members?.indexOf(user.$id) ?? -1;
    if (memberIndex < 0 || !["owner", "editor"].includes(board.memberRoles?.[memberIndex])) {
      return NextResponse.json({ error: "You do not have permission to move cards" }, { status: 403 });
    }

    const columns = new Map();
    const cards = await Promise.all(updates.map(({ id }) => databases.getDocument(db, cardsId, id)));
    for (const update of updates) {
      let targetColumn = columns.get(update.columnId);
      if (!targetColumn) {
        targetColumn = await databases.getDocument(db, columnsId, update.columnId);
        columns.set(update.columnId, targetColumn);
      }
      if (targetColumn.boardId !== boardId) {
        return NextResponse.json({ error: "Target column does not belong to this board" }, { status: 403 });
      }
    }

    for (const card of cards) {
      const sourceColumn = await databases.getDocument(db, columnsId, card.columnId);
      if (sourceColumn.boardId !== boardId) {
        return NextResponse.json({ error: "Card does not belong to this board" }, { status: 403 });
      }
    }

    const updatedCards = await Promise.all(updates.map(({ id, columnId, order }) =>
      databases.updateDocument(db, cardsId, id, { columnId, order }),
    ));
    return NextResponse.json({ cards: updatedCards });
  } catch (error) {
    console.error("Card reorder failed:", error);
    const status = Number.isInteger(error?.code) && error.code >= 400 && error.code < 500 ? error.code : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to reorder cards." : error?.message ?? "Unable to reorder cards." }, { status });
  }
}
