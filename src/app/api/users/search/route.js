import { NextResponse } from "next/server";
import { Account, Client, Databases, Query, Users } from "node-appwrite";
import { db, profilesId } from "@/models/name";

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setJWT(authorization.slice(7).trim());
    const user = await new Account(client).get();
    const term = new URL(request.url).searchParams.get("q")?.trim();
    if (!term || term.length < 2) return NextResponse.json({ users: [] });

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(adminClient);
    const appwriteUsers = new Users(adminClient);
    const [nameMatches, idMatches, accountMatches] = await Promise.all([
      databases.listDocuments(db, profilesId, [Query.contains("displayName", term), Query.limit(20)]),
      databases.listDocuments(db, profilesId, [Query.equal("userId", term), Query.limit(1)]),
      appwriteUsers.list({ queries: [Query.contains("name", term), Query.limit(20)], total: false }),
    ]);
    const matches = new Map();
    for (const profile of [...nameMatches.documents, ...idMatches.documents]) {
      matches.set(profile.userId, profile);
    }
    for (const account of accountMatches.users) {
      const name = account.name ?? "";
      if (!name.toLocaleLowerCase().includes(term.toLocaleLowerCase())) continue;
      if (!matches.has(account.$id)) {
        matches.set(account.$id, { userId: account.$id, displayName: name, bio: "", avatarId: "" });
      }
    }
    return NextResponse.json({
      users: [...matches.values()]
        .filter((profile) => profile.userId !== user.$id)
        .map(({ userId, displayName, bio, avatarId }) => ({ userId, displayName, bio, avatarId })),
    });
  } catch (error) {
    const status = Number.isInteger(error?.code) && error.code >= 400 && error.code < 500 ? error.code : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to search users." : error.message }, { status });
  }
}
