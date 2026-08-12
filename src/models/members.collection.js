import { databases } from "@/lib/server/config";
import { db, membersId } from "./name";

const DATABASE_ID = db;
const COLLECTION_ID = membersId;

export async function createMembersCollection() {
  try {
    const collection = await databases.createCollection({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      name: "members",
    });

    console.log("Columns collection created succesfully: ");

    await databases.createStringAttribute({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      key: "boardId",
      size: 36,
      required: true,
    });

    await databases.createStringAttribute({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      key: "userId",
      size: 36,
      required: true,
    });

    await databases.createStringAttribute({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      key: "role",
      required: true,
    });

    console.log("Attributes of members collection created");
  } catch (error) {
    console.error(
      "something went wrong while creating members database or attributes",
      error,
    );
  }
}
