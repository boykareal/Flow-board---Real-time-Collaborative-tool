"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { userAuthStore } from "@/store/Auth";

export default function AuthenticatedHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const user = userAuthStore((state) => state.user);
  const hydrated = userAuthStore((state) => state.hydrated);
  const authChecked = userAuthStore((state) => state.authChecked);
  const logout = userAuthStore((state) => state.logout);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (!hydrated || !authChecked || !user || isAuthPage) {
    return null;
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 px-5 py-3 text-zinc-100 backdrop-blur sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          href="/boards"
          className="text-lg font-bold tracking-tight text-white transition-colors hover:text-indigo-300"
        >
          FlowBoard
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main navigation">
          <Link
            href="/boards"
            className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Boards
          </Link>
          <Link
            href={`/profile/${user.$id}`}
            className="max-w-32 truncate rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            {user.name || "Profile"}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-200"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
