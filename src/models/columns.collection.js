import { databases } from "../lib/server/config.js";
import { db, columnsId  } from "./name.js";

const DATABASE_ID = db;
const COLLECTION_ID = columnsId;

export async function createColumnsCollection(){
    try {
        const collection = await databases.createCollection({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            name: "columns",
        })

        console.log("Columns collection created succesfully: ")

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "boardId",
            size: 36,
            required: true
        })

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "title",
            size: 256,
            required: true
        })

        await databases.createIntegerAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "order",
            required: true,
        })
        
        console.log("Attributes of columns collection created")
    } catch (error) {
        console.error("something went wrong while creating columns database or attributes", error)
    }
}