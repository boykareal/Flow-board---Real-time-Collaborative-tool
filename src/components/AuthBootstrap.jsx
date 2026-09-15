"use client";

import { useEffect } from "react";
import { userAuthStore } from "@/store/Auth";

export default function AuthBootstrap() {
  const hydrated = userAuthStore((state) => state.hydrated);
  const authChecked = userAuthStore((state) => state.authChecked);
  const checkSession = userAuthStore((state) => state.checkSession);

  useEffect(() => {
    if (hydrated && !authChecked) {
      void checkSession();
    }
  }, [hydrated, authChecked, checkSession]);

  return null;
}
