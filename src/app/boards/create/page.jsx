"use client"
import { databases } from "@/lib/client/config"
import { userAuthStore } from "@/store/Auth"
import { ID, Permission, Role } from "appwrite"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { db, boardsId } from "@/models/name"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";


export default function createpage(){
    const router = useRouter();
    const user = userAuthStore((state) => state.user);
    const hydrated = userAuthStore((state) => state.hydrated);
    const authChecked = userAuthStore((state) => state.authChecked);
    useEffect(() => {
        if(!hydrated || !authChecked){
            return;
        }

        if(!user){
            router.push("/login");
            return;
        }
    },[user,hydrated,authChecked,router])

    async function handlesubmit(e){
        e.preventDefault();

        if(!authChecked || !user){
            return;
        }

        const formData = new FormData(e.currentTarget);

        const title = formData.get("title");
        const description = formData.get("description");
        const color = formData.get("color");

        if(typeof title !== "string" || title.trim().length < 6){
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
            memberRoles: ["owner"],
          },
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ],
        );

        router.push(`/boards/${board.$id}`);
    }

    if (!hydrated || !authChecked || !user) {
        return null;
    }

    return (
      <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-zinc-950 px-4 py-10">
        <Card className="w-full max-w-md border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl">
          <CardHeader>
            <CardTitle>Create board</CardTitle>

            <CardDescription className="text-zinc-400">
              Create a board to organize your work.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handlesubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-zinc-200">
                  Title
                </Label>

                <Input
                  id="title"
                  name="title"
                  placeholder="Enter board title"
                  className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-200">
                  Description
                </Label>

                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter board description (optional)"
                  className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="color" className="text-zinc-200">
                  Board color
                </Label>

                <Input
                  id="color"
                  name="color"
                  type="color"
                  defaultValue="#3b82f6"
                  className="h-10 w-16 cursor-pointer border-zinc-700 bg-zinc-950 p-1"
                />
              </div>
            </CardContent>

            <CardFooter className="mt-2 border-0 bg-transparent px-4 pb-4">
              <Button
                type="submit"
                className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Create Board
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    );
}
