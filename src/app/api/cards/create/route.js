import { NextResponse } from "next/server";
import {
  Account,
  AppwriteException,
  Client,
  Databases,
  ID,
  Permission,
  Query,
  Role,
  Storage,
} from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import {
  boardsId,
  cardsId,
  columnsId,
  db,
  storageId,
} from "@/models/name";

export async function POST(request) {
  const uploadedFileIds = [];

  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const jwt = authorization.slice(7).trim();

    if (!jwt) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const dueDate = formData.get("dueDate");
    const columnId = formData.get("columnId");
    const assigneeId = formData.get("assigneeId");
    const attachmentValues = formData.getAll("attachments");

    if (typeof title !== "string" || title.trim().length < 6) {
      return NextResponse.json(
        { error: "Card title must contain at least 6 characters." },
        { status: 400 },
      );
    }

    if (typeof columnId !== "string" || !columnId.trim()) {
      return NextResponse.json(
        { error: "Column ID is required." },
        { status: 400 },
      );
    }

    if (description !== null && typeof description !== "string") {
      return NextResponse.json(
        { error: "Description must be text." },
        { status: 400 },
      );
    }

    if (dueDate !== null && typeof dueDate !== "string") {
      return NextResponse.json(
        { error: "Due date is invalid." },
        { status: 400 },
      );
    }

    if (assigneeId !== null && typeof assigneeId !== "string") {
      return NextResponse.json(
        { error: "Assignee ID must be text." },
        { status: 400 },
      );
    }

    const files = attachmentValues.filter(
      (value) => value instanceof File && value.size > 0,
    );
    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);

    if (files.length > 5) {
      return NextResponse.json(
        { error: "You can upload up to 5 files." },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (!allowedTypes.has(file.type)) {
        return NextResponse.json(
          { error: `${file.name} is not an allowed file type.` },
          { status: 400 },
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `${file.name} must be smaller than 10 MB.` },
          { status: 400 },
        );
      }
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
    const serverDatabases = new Databases(serverClient);
    const storage = new Storage(serverClient);

    const column = await serverDatabases.getDocument(
      db,
      columnsId,
      columnId.trim(),
    );
    const board = await serverDatabases.getDocument(db, boardsId, column.boardId);
    const members = Array.isArray(board.members) ? board.members : [];
    const memberRoles = Array.isArray(board.memberRoles) ? board.memberRoles : [];
    const memberIndex = members.indexOf(user.$id);

    if (memberIndex === -1) {
      return NextResponse.json(
        { error: "You are not a member of this board." },
        { status: 403 },
      );
    }

    const role = memberRoles[memberIndex];

    if (role !== "owner" && role !== "editor") {
      return NextResponse.json(
        { error: "You do not have permission to create cards on this board." },
        { status: 403 },
      );
    }

    const normalizedAssigneeId =
      typeof assigneeId === "string" ? assigneeId.trim() : "";

    if (normalizedAssigneeId && !members.includes(normalizedAssigneeId)) {
      return NextResponse.json(
        { error: "Assignee must be a member of this board." },
        { status: 403 },
      );
    }

    let normalizedDueDate = null;

    if (typeof dueDate === "string" && dueDate.trim()) {
      const parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return NextResponse.json(
          { error: "Due date is invalid." },
          { status: 400 },
        );
      }

      normalizedDueDate = parsedDueDate.toISOString();
    }

    const lastCards = await serverDatabases.listDocuments(db, cardsId, [
      Query.equal("columnId", columnId.trim()),
      Query.orderDesc("order"),
      Query.limit(1),
    ]);
    const order =
      lastCards.documents.length === 0
        ? 0
        : lastCards.documents[0].order + 1;

    for (const file of files) {
      const uploadedFile = await storage.createFile(
        storageId,
        ID.unique(),
        InputFile.fromBuffer(Buffer.from(await file.arrayBuffer()), file.name),
      );
      uploadedFileIds.push(uploadedFile.$id);
    }

    const permissions = members.flatMap((memberId, index) => {
      const memberPermissions = [Permission.read(Role.user(memberId))];
      const memberRole = memberRoles[index];

      if (memberRole === "owner" || memberRole === "editor") {
        memberPermissions.push(
          Permission.update(Role.user(memberId)),
          Permission.delete(Role.user(memberId)),
        );
      }

      return memberPermissions;
    });

    const card = await serverDatabases.createDocument(
      db,
      cardsId,
      ID.unique(),
      {
        columnId: columnId.trim(),
        boardId: column.boardId,
        title: title.trim(),
        description: typeof description === "string" ? description.trim() : "",
        duedate: normalizedDueDate,
        order,
        labels: [],
        assigneeId: normalizedAssigneeId,
        createdBy: user.$id,
        attachementsid: uploadedFileIds,
      },
      permissions,
    );

    return NextResponse.json(
      { message: "Card created successfully", card },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create card failed:", error);

    if (uploadedFileIds.length > 0) {
      const cleanupClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);
      const cleanupStorage = new Storage(cleanupClient);

      await Promise.allSettled(
        uploadedFileIds.map((fileId) =>
          cleanupStorage.deleteFile(storageId, fileId),
        ),
      );
    }

    if (error instanceof AppwriteException) {
      if (error.code === 401) {
        return NextResponse.json(
          { error: "Your session is invalid or expired. Please sign in again." },
          { status: 401 },
        );
      }

      if (error.code === 403) {
        return NextResponse.json(
          { error: "You do not have permission to create cards on this board." },
          { status: 403 },
        );
      }

      if (error.code === 404) {
        return NextResponse.json(
          { error: "Column, board, or storage bucket was not found." },
          { status: 404 },
        );
      }

      if (error.code === 429) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 },
        );
      }
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to create card. Please try again." },
      { status: 500 },
    );
  }
}
