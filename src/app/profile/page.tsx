"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentProfileView from "@/components/profile/StudentProfileView";
import CompanyProfileView from "@/components/profile/CompanyProfileView";
import ProfessorProfileView from "@/components/profile/ProfessorProfileView";
import { fetchAuthMe, normalizeRole } from "@/api/session";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isReady, login } = useAuth();
  const [checking, setChecking] = useState(true); // guard against early redirect

  useEffect(() => {
    let alive = true;

    async function ensureSession() {
      // 1) If we already have a user (localStorage path), we're done
      if (user) {
        if (alive) setChecking(false);
        return;
      }

      // 2) Wait for AuthContext hydration
      if (!isReady) return;

      // 3) Probe the server cookie/session once
      try {
        console.log("[Profile] user is null after hydration; probing /api/auth/me…");
        const me = await fetchAuthMe(); // uses credentials: 'include' inside your helper
        console.log("[Profile] /api/auth/me raw:", me);

        // If not authenticated, redirect to login without throwing hard errors
        if (!me) {
          router.replace("/login");
          return;
        }

        const role = normalizeRole(me.role ?? me.roles) || "Student";
        // Populate client auth state so the rest of the app works
        login({
          access_token: localStorage.getItem("access_token") ?? "",
          refresh_token: localStorage.getItem("refresh_token") ?? "",
          user_name: me.user_name ?? "",
          email: me.email ?? "",
          roles: role,
        });

        if (alive) setChecking(false);
      } catch (err) {
        console.warn("[Profile] Not authenticated; redirecting to /login. Error:", err);
        // 4) Truly unauthenticated → send to login
        router.replace("/login");
      }
    }

    ensureSession();
    return () => {
      alive = false;
    };
  }, [user, isReady, login, router]);

  // While we’re checking cookie/session, show a tiny skeleton
  if (checking) return <div className="p-8 text-gray-600">Loading session…</div>;

  // At this point we must have a user (or we already redirected)
  if (!user) return null;

  const role = (user.role || "").toLowerCase();
  if (role === "company") return <CompanyProfileView />;
  if (role === "professor") return <ProfessorProfileView />;
  return <StudentProfileView />;
}
