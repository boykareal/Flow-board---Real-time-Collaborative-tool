"use client"
import { databases } from "@/lib/client/config";
import { userAuthStore } from "@/store/Auth";
import { db, boardsId } from "@/models/name";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function dashboardPage(){
    const [boards, setboards] = useState([]);
    const user = userAuthStore((state) => state.user);
    const hydrated = userAuthStore((state) => state.hydrated);
    const authChecked = userAuthStore((state) => state.authChecked);
    const router = useRouter();
    useEffect(() => {
        const getBoards = async() => {
            if (!hydrated || !authChecked) {
                return;
            }

            if (!user) {
                router.push("/login");
                return;
            }

            if(user){
              const result = await databases.listDocuments(db, boardsId, [
                Query.contains("members", user.$id),
              ]);
              setboards(result.documents)
            }
        };

        getBoards()
    },[user,hydrated,authChecked,router]);

    if (!hydrated || !authChecked || !user) {
        return null;
    }

    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Boards</h1>
            <p className="text-slate-400">Manage and organize your projects.</p>
          </div>

          <Button
            onClick={() => router.push("/boards/create")}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            + Create Board
          </Button>
        </div>

        {boards.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-8 text-center">
            <h2 className="text-xl font-semibold text-white">
              No boards created yet
            </h2>

            <p className="mt-2 text-slate-400">
              Create your first board to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Card key={board.$id}>
                <CardHeader>
                  <CardTitle>{board.title}</CardTitle>
                  <CardDescription>{board.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <p>{board.members?.length ?? 0} members</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
}