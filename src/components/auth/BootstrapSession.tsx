"use client";

import { useEffect } from "react";
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
    industry: "To be Added",     // non-empty
    tel: "0000000000",            // numeric placeholder
    location: "To be Added",      // non-empty
  };
}

export default function BootstrapSession() {
  const { user, login } = useAuth();

  useEffect(() => {
    if (user) return; // already hydrated

    (async () => {
      try {
        // 1) Hydrate from cookie session
        const me = await fetchAuthMe();
        const role = normalizeRole(me.role ?? me.roles) || "Student";

        // Store local auth state
        login({
          access_token: "",
          refresh_token: "",
          user_name: me.user_name ?? "",
          email: me.email ?? "",
          roles: role,
        });

        // 2) If Company, ensure a profile exists
        if (role.toLowerCase() === "company") {
          try {
            const existing = await getCompanyProfile(); // returns null on 404 in your helper
            if (!existing) {
              const payload = buildDefaultCompanyProfile(me);
              await createCompanyProfile(payload);
              // Optionally refetch to warm local state/UI:
              // const fresh = await getCompanyProfile();
            }
          } catch (err) {
            // If server says it exists or field validation fails, log and continue
            console.warn("[BootstrapSession] createCompanyProfile skipped:", err);
          }
        }
      } catch (err) {
        // Not logged in or /auth/me failed — ignore silently
        console.warn("[BootstrapSession] Not logged in or /auth/me failed:", err);
      }
    })();
  }, [user, login]);

  return null;
}
