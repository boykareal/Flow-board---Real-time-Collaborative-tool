import { NextResponse } from "next/server";
import { columnsId, db, boardsId, cardsId } from "@/models/name";
import { Client, Account, AppwriteException , Databases, Permission, Role, Query} from "node-appwrite";

export async function DELETE(request){
    try {
        const { columnId } = await request.json();
        const authorization = request.headers.get("Authorization");

        if (!authorization?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 },
            )
        }

        const jwt = authorization.slice(7).trim();

        if (!jwt) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 },
            )
        }

        if(typeof columnId !== "string" || columnId.length === 0){
            return NextResponse.json(
                {error:"Column id is required" },
                {status: 400}
            )
        }

        const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setJWT(jwt);
        
        const account = new Account(client);
        const databases = new Databases(client);
        const user = await account.get(); 

        const column = await databases.getDocument(db, columnsId, columnId);

        const board = await databases.getDocument(db, boardsId, column.boardId);

        const memberIndex = board.members.indexOf(user.$id);

        if (memberIndex === -1) {
          return NextResponse.json(
            { error: "You are not a member of this board" },
            { status: 403 },
          );
        }

        const role = board.memberRoles[memberIndex];

        if (role !== "owner" && role !== "editor") {
            return NextResponse.json(
                { error: "You do not have permission to delete columns" },
                { status: 403 },
            );
        }
        
        const serverClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

        const serverDatabases = new Databases(serverClient);

        const result = await serverDatabases.listDocuments(
            db,
            cardsId,
            [
                Query.equal("columnId",columnId),
                Query.limit(1),
            ]
        );
        
        if(result.documents.length !== 0){
            return NextResponse.json(
                {error: "please remove or place them in some other column to delete"},
                {status: 409}
            )
        }

        await serverDatabases.deleteDocument(db, columnsId, columnId);

        return NextResponse.json("Column deleted succesfully", { status: 200 });

    } catch (error) {
        console.error("Delete column failed:", error);

        if (error instanceof AppwriteException) {
          if (error.code === 401) {
            return NextResponse.json(
              {
                error:
                  "Your session is invalid or expired. Please sign in again.",
              },
              { status: 401 },
            );
          }
          
          if (error.code === 403) {
            return NextResponse.json(
              { error: "You do not have permission to delete this column." },
              { status: 403 },
            );
          }

          if (error.code === 404) {
            return NextResponse.json(
              { error: "Column or board not found." },
              { status: 404 },
            );
          }

          if (error.code === 429) {
            return NextResponse.json(
              { error: "Too many requests. Please try again shortly." },
              { status: 429 },
            );
          }
        }

        if (error instanceof SyntaxError) {
          return NextResponse.json(
            { error: "Invalid request body. Expected valid JSON." },
            { status: 400 },
          );
        }

        return NextResponse.json(
          { error: "Unable to delete column. Please try again." },
          { status: 500 },
        );
    }
}
