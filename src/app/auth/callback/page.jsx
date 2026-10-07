"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userAuthStore } from "@/store/Auth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const hydrated = userAuthStore((state) => state.hydrated);
  const authChecked = userAuthStore((state) => state.authChecked);
  const user = userAuthStore((state) => state.user);
  const recheckSession = userAuthStore((state) => state.recheckSession);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!hydrated || !authChecked) return;

    if (user) {
      router.replace("/boards");
      return;
    }

    const query = new URLSearchParams(window.location.search);
    if (query.get("oauth") === "failed") {
      const returnedFrom = query.get("returnTo");
      const returnPath = returnedFrom === "/signup" ? "sign up" : "login";
      setErrorMessage(`Google or GitHub sign-in did not complete. Please check the provider settings and try again from ${returnPath}.`);
      return;
    }

    let active = true;
    const retry = window.setTimeout(async () => {
      const result = await recheckSession();
      if (!active) return;
      if (result.success) {
        router.replace("/boards");
        return;
      }
      setErrorMessage(`Appwrite did not establish a session after sign-in: ${result.error}`);
    }, 500);

    return () => {
      active = false;
      window.clearTimeout(retry);
    };
  }, [hydrated, authChecked, user, recheckSession, router]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-xl sm:p-8">
        {errorMessage ? (
          <>
            <h1 className="text-lg font-semibold">Sign-in couldn’t finish</h1>
            <p role="alert" className="mt-3 text-sm leading-6 text-zinc-400">{errorMessage}</p>
            <Link href="/login" className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
              Return to login
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-400" aria-hidden="true" />
            <p role="status" className="mt-4 text-sm text-zinc-400">Finishing sign-in…</p>
          </>
        )}
      </div>
    </main>
  );
}
