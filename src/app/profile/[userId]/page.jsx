"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { userAuthStore } from "@/store/Auth";
import { withFreshJWT } from "@/lib/client/auth-request";

export default function ProfilePage() {
  const { userId } = useParams();
  const user = userAuthStore((state) => state.user);
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !userId) return;
    withFreshJWT(
      (token) => axios.get(`/api/profile/${encodeURIComponent(userId)}`, { headers: { Authorization: `Bearer ${token}` } }),
      () => {},
    ).then((response) => setProfile(response.data)).catch((error) => {
      toast.error(error.response?.data?.error ?? "Unable to load profile.");
    });
  }, [user, userId]);

  if (!profile) return <main className="mx-auto min-h-[calc(100svh-4rem)] max-w-2xl px-4 py-8 text-zinc-400 sm:px-6">Loading profile…</main>;

  async function copyUserId() {
    try {
      await navigator.clipboard.writeText(profile.userId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to copy the user ID.");
    }
  }

  return (
    <main className="mx-auto my-6 w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-xl sm:my-10 sm:w-[calc(100%-3rem)] sm:p-8">
      <div className="flex size-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-semibold">
        {profile.displayName?.charAt(0)?.toUpperCase() ?? "U"}
      </div>
      <h1 className="mt-5 text-2xl font-semibold">{profile.displayName}</h1>
      <p className="mt-4 whitespace-pre-wrap text-zinc-300">{profile.bio || "This user hasn’t added a bio yet."}</p>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">User ID</p>
        <div className="mt-2 flex items-center gap-3">
          <code className="min-w-0 flex-1 break-all text-sm text-zinc-200">{profile.userId}</code>
          <button type="button" onClick={copyUserId} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800" aria-label="Copy user ID">
            <Copy className="size-4" />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </main>
  );
}
