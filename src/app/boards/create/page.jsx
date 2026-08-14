"use client"
import { databases } from "@/lib/client/config"
import { userAuthStore } from "@/store/Auth"
import { ID } from "appwrite"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { db, boardsId } from "@/models/name"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"


export default function createpage(){
    const router = useRouter();
    const { user, hydrated } = userAuthStore((state) => ({
      user: state.user,
      hydrated: state.hydrated,
    }));
    useEffect(() => {
        if(hydrated === true && !user){
            router.push("/login");
            return;
        }
    },[user,hydrated,router])

    const handlesubmit = async(e) => {
        e.preventDefault();

        const formdata = new FormData(e.currentTarget);

        const title = formdata.get("title");
        const description = formdata.get("description");
        const color = formdata.get("color");

        if(typeof title !== string || title.length < 6){
            return;
        }

        const board = await databases.createDocument(
            db,
            boardsId,
            ID.unique(),
            {
                title,
                description,
                color,
                ownerId: user.$id,
                members: [user.$id],
                memberRoles: ["owner"]
            }
        )

        router.push(`/boards/${board.$id}`);
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create board</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handlesubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="title">title</label>
                <input
                  className="text-black"
                  id="title"
                  name="title"
                  placeholder="title"
                  type="text"
                  required
                />
              </div>

              <div>
                <label htmlFor="description">description</label>
                <input
                  className="text-black"
                  id="description"
                  name="description"
                  placeholder="description(optional)"
                  type="text"
                />
              </div>

              <div>
                <label htmlFor="color">color</label>
                <input
                  className="text-black"
                  id="color"
                  name="color"
                  type="color"
                  required
                />
              </div>

              <button type="submit">Create Board</button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
}
