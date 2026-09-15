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

        console.log("Create board submitted");

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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <Card className="w-full max-w-md border border-slate-700 bg-slate-900 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">Create board</CardTitle>

            <CardDescription className="text-slate-400">
              Create a board to organize your work.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handlesubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-200">
                  Title
                </Label>

                <Input
                  id="title"
                  name="title"
                  placeholder="Enter board title"
                  className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">
                  Description
                </Label>

                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter board description (optional)"
                  className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="color" className="text-slate-200">
                  Board color
                </Label>

                <Input
                  id="color"
                  name="color"
                  type="color"
                  defaultValue="#3b82f6"
                  className="h-10 w-16 cursor-pointer border-slate-700 bg-slate-800 p-1"
                />
              </div>
            </CardContent>

            <CardFooter className="mt-2 border-0 bg-transparent px-4 pb-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                Create Board
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
}
