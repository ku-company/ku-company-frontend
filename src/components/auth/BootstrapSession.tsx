"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchAuthMe, normalizeRole } from "@/api/session";
import { updateUserRole } from "@/api/user";
import { parseTokensFromLocation, stripTokensFromUrl } from "@/api/oauth";
import { createProfessorProfile } from "@/api/professorprofile";
import { getCompanyProfile, createDefaultCompanyProfile } from "@/api/companyprofile";

export default function BootstrapSession() {
  const { user, login } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    console.log("🟡 BootstrapSession started...");
    (async () => {
      const clearPendingStudentMarkers = () => {
        try {
          localStorage.removeItem("pending_oauth_signup_student");
          localStorage.removeItem("pending_oauth_signup_student_id");
        } catch {}
      };

      const syncPendingStudentId = async () => {
        const wantsSync = typeof window !== "undefined" && localStorage.getItem("pending_oauth_signup_student") === "1";
        const pendingId = typeof window !== "undefined" ? localStorage.getItem("pending_oauth_signup_student_id") : null;
        if (!wantsSync || !pendingId) return;
        const tokenOverride = localStorage.getItem("access_token") ?? "";
        if (!tokenOverride) {
          clearPendingStudentMarkers();
          return;
        }
        try {
          const patch = await updateUserRole("Student", {
            studentId: pendingId,
            consent: true,
            tokenOverride,
          });
          if (patch?.access_token) localStorage.setItem("access_token", patch.access_token);
          if (patch?.refresh_token) localStorage.setItem("refresh_token", patch.refresh_token);

          const latestToken = patch?.access_token || localStorage.getItem("access_token") || tokenOverride;
          const refreshed = await fetchAuthMe(latestToken);
          if (refreshed && refreshed.user_name) {
            const refreshedRole = normalizeRole(refreshed.role ?? refreshed.roles) || "unknown";
            login({
              access_token: latestToken || "",
              refresh_token: localStorage.getItem("refresh_token") ?? "",
              user_name: refreshed.user_name,
              email: refreshed.email ?? "",
              role: refreshedRole,
            });
            console.log("🟢 Student ID synced for OAuth signup");
          }
          clearPendingStudentMarkers();
        } catch (err) {
          console.error("⚠️ Failed to sync student ID after OAuth signup:", err);
          // Avoid locking the user into a bad state; allow retry manually if needed.
          clearPendingStudentMarkers();
        }
      };

      try {
        // 1) Capture OAuth tokens in URL (either ? or #) and store
        try {
          const tokens = parseTokensFromLocation();
          const fromSearch = new URLSearchParams(window.location.search);
          const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const isSignup = (fromSearch.get("signup") === "1") || (fromHash.get("signup") === "1");
          if (tokens?.access_token) {
            localStorage.setItem("access_token", tokens.access_token);
            if (tokens.refresh_token) localStorage.setItem("refresh_token", tokens.refresh_token);
            if (tokens.user_name) localStorage.setItem("user_name", tokens.user_name);
            if (tokens.email) localStorage.setItem("email", tokens.email);
            if (tokens.role) localStorage.setItem("role", tokens.role);
            // If this OAuth was initiated from a signup flow for Company, mark onboarding
            try {
              const roleNorm = String(tokens.role ?? "").toLowerCase();
              const pending = localStorage.getItem("pending_oauth_signup_company") === "1";
              if (pending || (isSignup && roleNorm.includes("company"))) {
                localStorage.setItem("needs_company_onboarding", "1");
                localStorage.removeItem("pending_oauth_signup_company");
              }
            } catch {}
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
          if (me.id !== undefined && me.id !== null) {
            try {
              localStorage.setItem("user_id", String(me.id));
            } catch {}
          }
          const resolvedRole = normalizeRole(me.role ?? me.roles) || "unknown";
          login({
            access_token: localStorage.getItem("access_token") ?? "",
            refresh_token: localStorage.getItem("refresh_token") ?? "",
            user_name: me.user_name,
            email: me.email ?? "",
            role: resolvedRole,
            id: me.id,
          });
          console.log("✅ Logged in as:", me.role ?? me.roles ?? "unknown");

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
          // If OAuth signup was initiated from /register/company but no tokens were present in URL,
          // ensure we still set the one-time onboarding flag based on the pending marker.
          try {
            const pending = localStorage.getItem("pending_oauth_signup_company") === "1";
            const roleNorm = String(me.role ?? me.roles ?? "").toLowerCase();
            if (pending && roleNorm.includes("company")) {
              localStorage.setItem("needs_company_onboarding", "1");
              localStorage.removeItem("pending_oauth_signup_company");
            }
          } catch {}

          // Keep profile bootstrap if you still want a default profile; does not trigger modal
          const roleNorm = String(me.role ?? me.roles ?? "").toLowerCase();
          if (roleNorm.includes("company")) {
            try {
              const existing = await getCompanyProfile();
              if (!existing) {
                const name = me.company_name || me.user_name || "";
                await createDefaultCompanyProfile(name);
                console.log("🏢 Ensured default company profile exists");
              }
            } catch (e) {
              console.warn("⚠️ Unable to ensure company profile:", e);
            }
          }

          await syncPendingStudentId();
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
