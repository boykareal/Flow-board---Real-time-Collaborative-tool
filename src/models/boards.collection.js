import { databases } from "@/lib/server/config";
import { db,boardsId } from "./name";

const DATABASE_ID = db;
const COLLECTION_ID = boardsId;

export async function createBoardsCollection(){
    try {
        const collection = await databases.createCollection({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            name: "Boards",
            documentSecurity: true,
        });

        console.log("Boards collection created Succesfully: ")

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "title",
            size: 100,
            required: true,
        });

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "ownerId",
            size: 36,
            required: true,
        });

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "description",
            size: 500,
            required: false,
        });

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "members",
            size: 36,
            required: true,
            array: true,
        });

        await databases.createStringAttribute({
            databasesId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "memberRoles",
            size: 20,
            required: true,
            array: true,
        });
        
        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "color",
            size: 30,
            required: false,
        });
        
        console.log("All board attributes created!")
    } catch (error) {
        console.error("something went wrong while creating collection or attribute", error);
    }
}

