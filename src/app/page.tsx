"use client";

import { useEffect, useState } from "react";
import JobCard from "@/components/jobcard";
import { Job } from "@/types/job";
import RoleSelectModal from "@/components/roleselector";
import { useAuth } from "@/context/AuthContext";
import { getAuthMe, updateUserRole, type AuthMe } from "@/api/user";

function normalizeRole(r?: string | null) {
  const raw = (r ?? "").trim().toLowerCase();
  if (!raw || raw.includes("unknown") || raw.includes("unset")) return "Unknown";
  if (raw.includes("company")) return "Company";
  if (raw.includes("student")) return "Student";
  if (raw.includes("professor")) return "Professor";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function HomePage() {
  const { user, login } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [patchingRole, setPatchingRole] = useState(false);

  function persistTokens(tokenPair: { access_token?: string; refresh_token?: string }) {
    if (tokenPair?.access_token) localStorage.setItem("access_token", tokenPair.access_token);
    if (tokenPair?.refresh_token) localStorage.setItem("refresh_token", tokenPair.refresh_token);
  }

  useEffect(() => {
    (async () => {
      try {
        // Bootstrap session (OAuth cookie or existing tokens)
        const me = await getAuthMe();
        console.log("✅ [Bootstrap] /api/auth/me:", me);

        // In case backend returns tokens here too:
        persistTokens({ access_token: me.access_token, refresh_token: me.refresh_token });

        const role = normalizeRole(me.role ?? me.roles);

        if (!user) {
          console.log("🌱 [Bootstrap] set AuthContext from /auth/me");
          login({
            access_token: localStorage.getItem("access_token") ?? "",
            refresh_token: localStorage.getItem("refresh_token") ?? "",
            user_name: me.user_name ?? "",
            email: me.email ?? "",
            roles: role,
          });
        }

        if (role === "Unknown") {
          console.log("🟡 Role is Unknown → open modal");
          setShowRoleModal(true);
        }
      } catch (err) {
        console.warn("⚠️ Not logged in (no cookie / auth):", err);
      }

      try {
        const res = await fetch("http://localhost:8000/api/mock/findjob", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        setJobs(data);
      } catch (e) {
        console.error("❌ Failed to load jobs:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [login, user]);

  async function handleRoleSelect(selected: string) {
    try {
      setPatchingRole(true);

      const payloadRole =
        selected.toLowerCase() === "student"
          ? "Student"
          : selected.toLowerCase() === "company"
          ? "Company"
          : selected.toLowerCase() === "professor"
          ? "Professor"
          : "Student";

      console.log("🟢 PATCH role →", payloadRole);
      // ⬇️ This returns tokens now
      const patchData = await updateUserRole(payloadRole);
      console.log("✅ PATCH data:", patchData);

      // Save NEW tokens from PATCH
      persistTokens({ access_token: patchData.access_token, refresh_token: patchData.refresh_token });

      // Optional but recommended: confirm new session with new token
      const newToken = patchData.access_token || localStorage.getItem("access_token") || "";
      console.log("📡 GET /api/auth/me using new token…");
      const me2 = await getAuthMe(newToken);
      console.log("✅ /api/auth/me with new token:", me2);

      // Final role
      const finalRole = normalizeRole(me2.role ?? me2.roles ?? patchData.role);
      console.log("🎯 Final role:", finalRole);

      // Update AuthContext (this updates Navbar too)
      login({
        access_token: localStorage.getItem("access_token") ?? "",
        refresh_token: localStorage.getItem("refresh_token") ?? "",
        user_name: me2.user_name ?? patchData.user_name ?? "",
        email: me2.email ?? patchData.email ?? "",
        roles: finalRole,
      });

      if (finalRole !== "Unknown") {
        console.log("🎉 Role updated → close modal");
        setShowRoleModal(false);
      }
    } catch (err) {
      console.error("❌ Failed to update role:", err);
      // keep modal open for retry
    } finally {
      setPatchingRole(false);
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Loading jobs and session…</div>;

  return (
    <main className="p-4 space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}

      <RoleSelectModal
        isOpen={showRoleModal}
        onClose={() => !patchingRole && setShowRoleModal(false)}
        onSelect={handleRoleSelect}
      />
    </main>
  );
}
