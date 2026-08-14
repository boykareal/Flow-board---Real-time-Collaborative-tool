import { Permission } from "node-appwrite";
import { storageId } from "./name.js";
import { storage } from "../lib/server/config.js"; 

export default async function getOrCreateStorage() {
  try {
    await storage.getBucket(storageId);
    console.log("Storage connected");
  } catch (error) {
    try {
      await storage.createBucket(
        storageId,
        storageId,
        [
          Permission.create("users"),
          Permission.read("any"),
          Permission.read("users"),
          Permission.update("users"),
          Permission.delete("users"),
        ],
        false,
        true,
        10 * 1024 * 1024,
        ["jpg", "png", "gif", "jpeg", "webp", "heic"],
      );

      console.log("Storage Created");
      console.log("Storage Connected");
    } catch (error) {
      console.error("Error creating storage:", error);
    }
  }
}
