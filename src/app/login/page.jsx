"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { userAuthStore } from "@/store/Auth";
import { useRouter } from "next/navigation"
import Link from "next/link";
import { Card,CardContent,CardTitle, CardHeader, CardDescription, CardFooter } from "@/components/ui/card";

export default function AuthPage(){
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const login = userAuthStore((state)=> state.login)

    async function handleSubmit(e){
        e.preventDefault();

        try {
            await login(email, password);
            router.push("/boards");
        } catch (error) {
            setErrorMessage("Invalid email or password.");
        }
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <Card
          className={
            "w-full max-w-md border border-slate-700 bg-slate-900 text-white shadow-2xl"
          }
        >
          <CardHeader>
            <CardTitle className={"text-white"}>Login to FlowBoard</CardTitle>
            <CardDescription className={"text-slate-400"}>
              Enter your details to access your boards.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className={"space-y-4"}>
              <div className="space-y-2">
                <Label htmlFor="email" className={"text-slate=200"}>
                  Email
                </Label>
                <Input
                  id="email"
                  type={"email"}
                  placeholder="you@example.com"
                  className={`border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 ${errorMessage ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className={`border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 ${errorMessage ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-sm font-medium text-red-400">
                  {errorMessage}
                </p>
              )}
            </CardContent>

            <CardFooter className="mt-2 flex-col gap-3 border-0 bg-transparent px-4 pb-0">
              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                Login
              </Button>

              <p className="text-sm text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
}
