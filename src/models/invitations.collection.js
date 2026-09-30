import { databases } from "../lib/server/config.js";
import { db, invitationsId } from "./name.js";

export async function createInvitationsCollection() {
  try {
    await databases.createCollection({
      databaseId: db,
      collectionId: invitationsId,
      name: "Board invitations",
      documentSecurity: true,
    });
    for (const key of ["boardId", "senderId", "recipientId", "status"]) {
      await databases.createStringAttribute({
        databaseId: db,
        collectionId: invitationsId,
        key,
        size: key === "status" ? 20 : 36,
        required: true,
      });
    }
  } catch (error) {
    console.error("Could not create invitations collection", error);
  }
}
