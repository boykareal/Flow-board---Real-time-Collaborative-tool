import { databases } from "../lib/server/config.js";
import { db, commentsId } from "./name.js";

const DATABASE_ID = db;
const COLLECTION_ID = commentsId

export async function createCommentsCollection(){
    try {
        const collection = await databases.createCollection({
          databaseId: DATABASE_ID,
          collectionId: COLLECTION_ID,
          name: "comments",
        });

        console.log("comments collection created sucessfully")

        await databases.createStringAttribute({
          databaseId: DATABASE_ID,
          collectionId: COLLECTION_ID,
          key: "cardId",
          size:36,
          required: true,
        });

        await databases.createStringAttribute({
          databaseId: DATABASE_ID,
          collectionId: COLLECTION_ID,
          key: "authorId",
          size:36,
          required: true,
        });

        await databases.createStringAttribute({
          databaseId: DATABASE_ID,
          collectionId: COLLECTION_ID,
          key: "content",
          size: 5000,
          required: true,
        });

        
    } catch (error) {
        console.error("Something went wrong while creating comments collection or attributes", error)
    }
}