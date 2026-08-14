import { databases } from "../lib/server/config.js";
import { db,cardsId  } from "./name.js";

const DATABASE_ID = db;
const COLLECTION_ID = cardsId;

export async function createCardsCollection(){
    try {
        const collection = await databases.createCollection({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            name: "cards",
        })

        console.log("Cards collection created Succesfullly: ")

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "columnId",
            size: 36,
            required: true
        })

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

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "description",
            size: 5000,
            required: false
        })

        await databases.createIntegerAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "order",
            required: true
        })

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "assigneeId",
            size: 36,
            required: false
        })

        await databases.createDatetimeAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "duedate",
            required: false
        })

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "labels",
            required: false,
            size: 36,
            array: true
        })

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId:COLLECTION_ID,
            key: "attachementsid",
            required: false,
            size: 36,
            array: true
        })

        await databases.createStringAttribute({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            key: "createdBy",
            size: 36,
            required : true,
        })
    } catch (error) {
        console.error("Something went wrong while creating cards collection or attributes",error)
    }
}