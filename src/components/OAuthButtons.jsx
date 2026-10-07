"use client";

import { useState } from "react";
import { OAuthProvider } from "appwrite";
import { account } from "@/lib/client/config";
import { Button } from "@/components/ui/button";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-4">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.2H24v7.9h11a9.4 9.4 0 0 1-4.1 6.2l6.4 5C41.1 35.8 43.6 30.6 43.6 24.5Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.3-4.9l-6.4-5c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4l-6.6 5.1C7.3 39.4 15 44 24 44Z" />
      <path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4L6 15.2a20 20 0 0 0 0 17.6l6.6-5.1Z" />
      <path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3l5.8-5.8A19.4 19.4 0 0 0 24 4C15 4 7.3 8.6 4.4 15.2l6.6 5.1c1.6-4.8 6.1-8.2 13-8.2Z" />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.29-1.23-1.63-1.23-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.62 1.2 3.26.92.1-.72.39-1.2.71-1.48-2.48-.28-5.08-1.24-5.08-5.5 0-1.21.43-2.2 1.15-2.98-.12-.29-.5-1.41.11-2.94 0 0 .94-.3 3.06 1.14a10.7 10.7 0 0 1 5.57 0c2.12-1.44 3.06-1.14 3.06-1.14.61 1.53.23 2.65.11 2.94.72.78 1.15 1.77 1.15 2.98 0 4.27-2.61 5.22-5.1 5.5.4.35.76 1.03.76 2.08v3.1c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

export default function OAuthButtons({ failurePath = "/login" }) {
  const [error, setError] = useState("");

  function startOAuth(provider) {
    setError("");
    try {
      const origin = window.location.origin;
      account.createOAuth2Session(
        provider,
        `${origin}/boards`,
        `${origin}${failurePath}`,
      );
    } catch {
      setError("Could not start sign in. Please try again.");
    }
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-800" />
        or continue with
        <span className="h-px flex-1 bg-zinc-800" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="w-full border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
          onClick={() => startOAuth(OAuthProvider.Google)}
        >
          <GoogleMark /> Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
          onClick={() => startOAuth(OAuthProvider.Github)}
        >
          <GithubMark /> GitHub
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
