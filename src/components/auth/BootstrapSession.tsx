"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchAuthMe, normalizeRole } from "@/api/session";

export default function BootstrapSession() {
  const { user, login } = useAuth();

  useEffect(() => {
    if (user) return; // already logged in
    (async () => {
      try {
        const me = await fetchAuthMe(); // relies on backend cookie
        login({
          access_token: "",            // cookie flow: tokens may be httpOnly on server
          refresh_token: "",
          user_name: me.user_name ?? "",
          email: me.email ?? "",
          roles: normalizeRole(me.role ?? me.roles) || "Student",
        });
      } catch {
        // not logged in via cookie; do nothing
      }
    })();
  }, [user, login]);

  return null;
}
