import { db } from "../models/name";
import createBoardsCollection from "./boards.collection";
import createCardsCollection from "./cards.collection";
import createColumnsCollection from "./columns.collection";
import createCommentsCollection from "./comments.collection";
import { createMembersCollection } from "./members.collection";
import { databases } from "@/lib/server";

export default async function getOrCreateDB() {
  try {
    await databases.get(db);
    console.log("Database Connected");
  } catch (error) {
    try {
      await databases.create(db, db);
      console.log("database created");
      await Promise.all([
        createBoardsCollection(),
        createCardsCollection(),
        createColumnsCollection(),
        createCommentsCollection(),
        createMembersCollection()
      ]);
      console.log("Collection created succesfully");
      console.log("Database connected");
    } catch (error) {
      console.log("Error creating databases or collection", error);
    }
  }
}
