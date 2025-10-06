// src/components/auth/BootstrapSession.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchAuthMe, normalizeRole } from "@/api/session";
import {
  getCompanyProfile,
  createCompanyProfile,
  type CompanyProfile,
} from "@/api/companyprofile";

// Prefer backend-provided company_name; otherwise fall back
function deriveCompanyName(me: any): string {
  if (me?.company_name && String(me.company_name).trim()) return me.company_name.trim();
  if (me?.user_name && String(me.user_name).trim()) return me.user_name.trim();
  if (me?.email && typeof me.email === "string") {
    const at = me.email.indexOf("@");
    if (at > 0) return me.email.slice(0, at);
  }
  return "New Company";
}

// Safe defaults to satisfy backend validators (no empty strings)
function buildDefaultCompanyProfile(me: any): CompanyProfile {
  return {
    company_name: deriveCompanyName(me),
    description: "To be Added",
    industry: "To be Added", // non-empty
    tel: "0000000000",        // numeric placeholder
    location: "To be Added",  // non-empty
  };
}

export default function BootstrapSession() {
  const { user, login } = useAuth();
  const pathname = usePathname();
  const ranRef = useRef(false);

  // Do not bootstrap session on auth pages to avoid hijacking the login flow
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/logout" ||
    pathname === "/oauth/callback" ||
    (pathname?.startsWith("/register"));

  useEffect(() => {
    if (isAuthRoute) return;   
    if (user) return;         
    if (ranRef.current) return; // prevent double-run on fast refresh/navigation
    ranRef.current = true;

    (async () => {
      try {
        const me = await fetchAuthMe();
        const role = normalizeRole(me.role ?? me.roles) || "Student";

        login({
          access_token: localStorage.getItem("access_token") ?? "",
          refresh_token: localStorage.getItem("refresh_token") ?? "",
          user_name: me.user_name ?? "",
          email: me.email ?? "",
          roles: role,
        });

        // If Company, ensure a profile exists
        if (role.toLowerCase() === "company") {
          try {
            const existing = await getCompanyProfile(); // returns null on 404 in your helper
            if (!existing) {
              const payload = buildDefaultCompanyProfile(me);
              await createCompanyProfile(payload);
            }
          } catch (err) {
            console.warn("[BootstrapSession] createCompanyProfile skipped:", err);
          }
        }
      } catch (err) {
        console.warn("[BootstrapSession] Not logged in or /auth/me failed:", err);
      }
    })();
  }, [isAuthRoute, user, login, pathname]);

  return null;
}
