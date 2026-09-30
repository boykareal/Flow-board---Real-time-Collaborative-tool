import { NextResponse } from "next/server";
import { Account, Client, Databases, Users } from "node-appwrite";
import { db, profilesId } from "@/models/name";

export async function GET(request, { params }) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const client = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setJWT(authorization.slice(7).trim());
    await new Account(client).get();
    const { userId } = await params;
    const admin = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(admin);
    try {
      const profile = await databases.getDocument(db, profilesId, userId);
      return NextResponse.json({ userId: profile.userId, displayName: profile.displayName, bio: profile.bio ?? "", avatarId: profile.avatarId ?? "" });
    } catch (error) {
      if (error?.code !== 404) throw error;
      const account = await new Users(admin).get(userId);
      return NextResponse.json({ userId: account.$id, displayName: account.name || "FlowBoard user", bio: "", avatarId: "" });
    }
  } catch (error) {
    const status = Number.isInteger(error?.code) && error.code >= 400 && error.code < 500 ? error.code : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to load profile." : error.message }, { status });
  }
}
