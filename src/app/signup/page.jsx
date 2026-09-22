"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

import { userAuthStore } from "@/store/Auth";

export default function SignupPage() {
  const router = useRouter();
  const createAccount = userAuthStore((state) => state.createAccount);
  const login = userAuthStore((state) => state.login);
  const createOrUpdateProfile = userAuthStore(
    (state) => state.createOrUpdateProfile,
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      await createAccount(name, email, password);
      await login(email, password);
      await createOrUpdateProfile(name);
      router.push("/boards");
    } catch (error) {
      setErrorMessage("Unable to create account. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border border-slate-700 bg-slate-900 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white">Create your account</CardTitle>

          <CardDescription className="text-slate-400">
            Sign up to start using FlowBoard.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Name
              </Label>

              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
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
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">
                Confirm password
              </Label>

              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                required
              />
            </div>

            {errorMessage && (
              <p className="text-sm font-medium text-red-400">{errorMessage}</p>
            )}
          </CardContent>

          <CardFooter className="mt-2 flex-col gap-3 border-0 bg-transparent px-4 pb-0">
            <Button
              type="submit"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Sign up
            </Button>

            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
              >
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
