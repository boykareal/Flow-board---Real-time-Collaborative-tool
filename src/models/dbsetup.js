import { db } from "./name.js";
import {createBoardsCollection} from "./boards.collection.js";
import {createCardsCollection} from "./cards.collection.js";
import {createColumnsCollection} from "./columns.collection.js";
import {createCommentsCollection} from "./comments.collection.js";
import { createMembersCollection } from "./members.collection.js";
import { databases } from "../lib/server/config.js";

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

getOrCreateDB()
