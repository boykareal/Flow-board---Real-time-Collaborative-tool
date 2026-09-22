import { databases } from "../lib/server/config.js";
import { db, profilesId } from "./name.js";

const DATABASE_ID = db;
const COLLECTION_ID = profilesId;

export async function createProfilesCollection() {
  try {
    await databases.createCollection({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      name: "profiles",
      documentSecurity: true,
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
      key: "displayName",
      size: 256,
      required: true,
    });

    await databases.createStringAttribute({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      key: "bio",
      size: 5000,
      required: false,
    });

    await databases.createStringAttribute({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      key: "avatarId",
      size: 36,
      required: false,
    });

    console.log("Profiles collection created successfully");
  } catch (error) {
    console.error("Something went wrong while creating profiles collection", error);
  }
}
