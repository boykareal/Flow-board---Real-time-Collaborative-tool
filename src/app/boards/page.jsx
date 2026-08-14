"use client"
import { databases } from "@/lib/client/config";
import { userAuthStore } from "@/store/Auth";
import { db, boardsId } from "@/models/name";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function boardsPage(){
    const [boards, setboards] = useState([]);
    const { user, hydrated } = userAuthStore((state) => ({
       user: state.user,
       hydrated: state.hydrated,
     }));
    const router = useRouter();
    useEffect(() => {
        const getBoards = async() => {
            
            if (hydrated === true && !user) {
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
    },[user,hydrated]);

    if(boards.length === 0){
        return (<div className="flex justify-center items-center min-h-screen">
            <p>No boards created yet</p>
        </div>)
    }

    return (
      <div className="grid grid-cols-3 gap-4">
        {boards.length}
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
    );
}