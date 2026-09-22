import { NextResponse } from "next/server";
import {
  Account,
  Client,
  Databases,
  ID,
  Permission,
  Role,
} from "node-appwrite";
import { db, profilesId } from "@/models/name";

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const jwt = authorization.slice(7).trim();
    if (!jwt) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { displayName } = await request.json();
    if (typeof displayName !== "string" || !displayName.trim()) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }

    const userClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setJWT(jwt);
    const user = await new Account(userClient).get();

    const serverClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(serverClient);

    const profileData = {
      userId: user.$id,
      displayName: displayName.trim(),
    };

    let profile;
    try {
      profile = await databases.getDocument(db, profilesId, user.$id);
      profile = await databases.updateDocument(
        db,
        profilesId,
        user.$id,
        { displayName: profileData.displayName },
      );
    } catch (error) {
      if (error?.code !== 404) throw error;

      profile = await databases.createDocument(
        db,
        profilesId,
        user.$id || ID.unique(),
        profileData,
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
        ],
      );
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error("Profile creation failed:", error);
    const status =
      Number.isInteger(error?.code) && error.code >= 400 && error.code < 500
        ? error.code
        : 500;

    return NextResponse.json(
      { error: status === 500 ? "Unable to save profile" : error.message },
      { status },
    );
  }
}
