"use client"
import { databases } from "@/lib/client/config";
import { userAuthStore } from "@/store/Auth";
import { db, boardsId } from "@/models/name";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function dashboardPage(){
    const [boards, setboards] = useState([]);
    const user = userAuthStore((state) => state.user);
    const hydrated = userAuthStore((state) => state.hydrated);
    const authChecked = userAuthStore((state) => state.authChecked);
    const router = useRouter();
    useEffect(() => {
        const getBoards = async () => {
            if (!hydrated || !authChecked) {
                return;
            }

            if (!user) {
                router.push("/login");
                return;
            }

            const result = await databases.listDocuments(db, boardsId, [
              Query.contains("members", user.$id),
            ]);
            setboards(result.documents);
        };

        getBoards();
        window.addEventListener("flowboard:boards-refresh", getBoards);
        return () => window.removeEventListener("flowboard:boards-refresh", getBoards);
    },[user,hydrated,authChecked,router]);

    if (!hydrated || !authChecked || !user) {
        return null;
    }

    return (
      <main className="min-h-[calc(100svh-4rem)] bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6 sm:py-8 lg:px-8">
       <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Your Boards</h1>
            <p className="text-zinc-400">Manage and organize your projects.</p>
          </div>

          <Button
            onClick={() => router.push("/boards/create")}
            className="w-full bg-indigo-600 text-white hover:bg-indigo-500 sm:w-auto"
          >
            + Create Board
          </Button>
        </div>

        {boards.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-white">
              No boards created yet
            </h2>

            <p className="mt-2 text-zinc-400">
              Create your first board to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {boards.map((board) => (
              <Link
                key={board.$id}
                href={`/boards/${board.$id}`}
                className="block"
              >
                <Card className="h-full cursor-pointer border-zinc-800 bg-zinc-900 text-zinc-100 transition hover:border-indigo-500/70 hover:shadow-lg hover:shadow-indigo-950/30">
                  <CardHeader>
                    <CardTitle>{board.title}</CardTitle>

                    <CardDescription className="text-zinc-400">
                      {board.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <p className="text-zinc-400">
                      {board.members?.length ?? 0} members
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
       </div>
      </main>
    );
}
