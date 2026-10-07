"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { userAuthStore } from "@/store/Auth";

export default function AuthBootstrap() {
  const hydrated = userAuthStore((state) => state.hydrated);
  const authChecked = userAuthStore((state) => state.authChecked);
  const checkSession = userAuthStore((state) => state.checkSession);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/auth/callback" && hydrated && !authChecked) {
      void checkSession();
    }
  }, [pathname, hydrated, authChecked, checkSession]);

  return null;
}
