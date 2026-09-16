import { db,boardsId,columnsId } from "@/models/name";
import { NextResponse } from "next/server";
import { Client, Account, AppwriteException , Databases, ID , Permission, Role, Query} from "node-appwrite";

export async function POST(request) {
    try {
      const {boardId, title} = await request.json();
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

      if (typeof title !== "string" || title.trim().length < 5) {
        return NextResponse.json(
          { error: "Column title is required" },
          { status: 400 },
        );
      }

      const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setJWT(jwt);

      const account = new Account(client);
      const databases = new Databases(client);
      const user = await account.get(); 

      try {
        if (typeof boardId !== "string" || !boardId.trim()) {
          return NextResponse.json(
            { error: "Board ID is required" },
            { status: 400 },
          );
        }

        const boards = await databases.getDocument(db, boardsId, boardId);
        const memberIndex = boards.members.indexOf(user.$id);

        if (memberIndex === -1) {
          return NextResponse.json(
            { error: "You are not a member of this board" },
            { status: 403 },
          );
        }

        const role = boards.memberRoles[memberIndex];

        if (role !== "owner" && role !== "editor") {
          return NextResponse.json(
            { error: "You do not have permission to create columns" },
            { status: 403 },
          );
        }

        const permissions = boards.members.map((memberId) =>Permission.read(Role.user(memberId)));

        const serverClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

        const serverDatabases = new Databases(serverClient);

        const lastColumn = await serverDatabases.listDocuments(db, columnsId, [
          Query.equal("boardId", boardId),
          Query.orderDesc("order"),
          Query.limit(1),
        ]);

        const order = lastColumn.documents.length === 0 ? 0 : lastColumn.documents[0].order + 1;

        const column = await serverDatabases.createDocument(
          db,
          columnsId,
          ID.unique(),
          {
            boardId,
            title: title.trim(),
            order,
          },
          permissions,
        );

        return NextResponse.json(column, { status: 201 });

      } catch (error) {
        if(error instanceof AppwriteException && error.code === 404){
            return NextResponse.json(
                {error: "Board not found"},
                {status: 404}
            )
        }
        throw error
      }

    } catch (error) {
       console.error("Create column failed:", error);

       if (error instanceof AppwriteException && error.code === 401) {
         return NextResponse.json(
           { error: "Authentication failed or access was denied" },
           { status: 401 },
         );
       }

       if (error instanceof AppwriteException && error.code === 403) {
         return NextResponse.json(
           { error: "You do not have permission to perform this action" },
           { status: 403 },
         );
       }

       if (error instanceof AppwriteException && error.code === 429) {
         return NextResponse.json(
           { error: "Too many requests. Please wait before trying again." },
           { status: 429 },
         );
       }

       return NextResponse.json(
         { error: "Unable to create column. Please try again." },
         { status: 500 },
       );
    }
}
