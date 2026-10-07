"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { userAuthStore } from "@/store/Auth";
import OAuthButtons from "@/components/OAuthButtons";
import { useRouter } from "next/navigation"
import Link from "next/link";
import { Card,CardContent,CardTitle, CardHeader, CardDescription, CardFooter } from "@/components/ui/card";

export default function AuthPage(){
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const login = userAuthStore((state)=> state.login)
    const user = userAuthStore((state) => state.user);
    const hydrated = userAuthStore((state) => state.hydrated);
    const authChecked = userAuthStore((state) => state.authChecked);
    const checkSession = userAuthStore((state) => state.checkSession);

    useEffect(() => {
      if (hydrated && !authChecked) {
        void checkSession();
      }
    }, [hydrated, authChecked, checkSession]);

    useEffect(() => {
      if (hydrated && authChecked && user) {
        router.replace("/boards");
      }
    }, [hydrated, authChecked, user, router]);

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
      <main className="flex min-h-svh items-center justify-center bg-zinc-950 px-4 py-10">
        <Card
          className={
            "w-full max-w-md border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl"
          }
        >
          <CardHeader>
            <CardTitle>Login to FlowBoard</CardTitle>
            <CardDescription className={"text-zinc-400"}>
              Enter your details to access your boards.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className={"space-y-4"}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type={"email"}
                  placeholder="you@example.com"
                  className={`border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 ${errorMessage ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-200">
                  Password
                </Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className={`border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 ${errorMessage ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-sm font-medium text-rose-400">
                  {errorMessage}
                </p>
              )}
            </CardContent>

            <CardFooter className="mt-2 flex-col gap-3 border-0 bg-transparent px-4 pb-0">
              <Button
                type="submit"
                className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Login
              </Button>

              <p className="text-sm text-zinc-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-indigo-300 hover:text-indigo-200 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
          <OAuthButtons failurePath="/login" />
        </Card>
      </main>
    );
}
