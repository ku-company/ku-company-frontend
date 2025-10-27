"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchAuthMe, normalizeRole } from "@/api/session";
import { parseTokensFromLocation, stripTokensFromUrl } from "@/api/oauth";
import { createProfessorProfile } from "@/api/professorprofile";

export default function BootstrapSession() {
  const { user, login } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    console.log("🟡 BootstrapSession started...");
    (async () => {
      try {
        // 1) Capture OAuth tokens in URL (either ? or #) and store
        try {
          const tokens = parseTokensFromLocation();
          if (tokens?.access_token) {
            localStorage.setItem("access_token", tokens.access_token);
            if (tokens.refresh_token) localStorage.setItem("refresh_token", tokens.refresh_token);
            if (tokens.user_name) localStorage.setItem("user_name", tokens.user_name);
            if (tokens.email) localStorage.setItem("email", tokens.email);
            if (tokens.role) localStorage.setItem("role", tokens.role);
            stripTokensFromUrl();
            console.log("✅ Stored OAuth tokens from URL");
          }
        } catch (e) {
          console.warn("⚠️ Failed to parse OAuth tokens from URL:", e);
        }

        // 2) Fetch current user using cookie or newly stored token
        const me = await fetchAuthMe();
        console.log("🟢 fetchAuthMe() returned:", me);

        if (me && me.user_name) {
          login({
            access_token: localStorage.getItem("access_token") ?? "",
            refresh_token: localStorage.getItem("refresh_token") ?? "",
            user_name: me.user_name,
            email: me.email ?? "",
            role: me.role ?? me.roles ?? "student",
          });
          console.log("✅ Logged in as:", me.role ?? me.roles);

          // Auto-create professor profile to bypass backend bug
          try {
            const roleNorm = normalizeRole(me.role ?? me.roles);
            if (roleNorm === "professor") {
              await createProfessorProfile({ department: "computer", faculty: "engineering" });
              console.log("🟢 Professor profile ensured");
            }
          } catch (e) {
            console.warn("⚠️ Skipping professor profile auto-create:", e);
          }
        } else {
          console.warn("⚠️ No user data from fetchAuthMe()");
        }
      } catch (err) {
        console.error("❌ BootstrapSession failed:", err);
      }
    })();
  }, [login]);

  return null;
}
