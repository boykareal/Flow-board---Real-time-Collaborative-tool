import { databases } from "../lib/server/config.js";
import { db, profilesId } from "./name.js";

const DATABASE_ID = db;
const COLLECTION_ID = profilesId;

export async function ensureProfilesSearchIndex() {
  for (const { attributeKey, indexKey } of [
    { attributeKey: "displayName", indexKey: "displayName_key" },
    { attributeKey: "userId", indexKey: "userId_key" },
  ]) {
    let indexes = await databases.listIndexes(DATABASE_ID, COLLECTION_ID);
    let index = indexes.indexes.find((candidate) => candidate.key === indexKey);
    if (index?.status === "available") continue;

    let attribute;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      attribute = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, attributeKey);
      if (attribute.status === "available") break;
      if (attribute.status === "failed" || attribute.status === "stuck") {
        throw new Error(`Appwrite could not create the ${attributeKey} attribute (${attribute.status}).`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (attribute?.status !== "available") {
      throw new Error(`Timed out waiting for the ${attributeKey} attribute to become available.`);
    }

    if (!index) {
      await databases.createIndex({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        key: indexKey,
        type: "key",
        attributes: [attributeKey],
      });
    }
    for (let attempt = 0; attempt < 60; attempt += 1) {
      indexes = await databases.listIndexes(DATABASE_ID, COLLECTION_ID);
      index = indexes.indexes.find((candidate) => candidate.key === indexKey);
      if (index?.status === "available") break;
      if (index?.status === "failed" || index?.status === "stuck") {
        throw new Error(`Appwrite could not create the ${indexKey} index (${index.status}).`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (index?.status !== "available") {
      throw new Error(`Timed out waiting for the ${indexKey} index to become available.`);
    }
  }
}

export async function ensureProfilesAvatarAttribute() {
  try {
    await databases.getAttribute(DATABASE_ID, COLLECTION_ID, "avatarId");
    return;
  } catch (error) {
    if (error?.code !== 404) throw error;
  }
  await databases.createStringAttribute({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID,
    key: "avatarId",
    size: 36,
    required: false,
  });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const attribute = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, "avatarId");
    if (attribute.status === "available") return;
    if (attribute.status === "failed" || attribute.status === "stuck") {
      throw new Error(`Appwrite could not create the avatarId attribute (${attribute.status}).`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Timed out waiting for the avatarId attribute to become available.");
}

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

    await ensureProfilesSearchIndex();

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
