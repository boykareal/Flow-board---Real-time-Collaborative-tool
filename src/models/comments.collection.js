import { databases } from "@/lib/server/config";
import { db, commentsId } from "./name";

const DATABASE_ID = db;
const COLLECTION_ID = commentsId

export async function createCommentsCollection(){
    try {
        const collection = await databases.createCollection({
            databaseId: DATABASE_ID,
            collectionid: COLLECTION_ID,
            name: "comments"
        })

        console.log("comments collection created sucessfully")

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionid: COLLECTION_ID,
            key:"cardId",
            required: true,
        })

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionid: COLLECTION_ID,
            key: "authorId",
            required: true
        })

        await databases.createStringAttribute({
          databaseId: DATABASE_ID,
          collectionid: COLLECTION_ID,
          key: "authorId",
          required: true,
        });

        await databases.createStringAttribute({
          databaseId: DATABASE_ID,
          collectionid: COLLECTION_ID,
          key: "content",
          required: true,
        });

        
    } catch (error) {
        console.error("Something went wrong while creating comments collection or attributes", error)
    }
}