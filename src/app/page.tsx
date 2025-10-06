"use client";

import { useEffect, useState } from "react";
import JobCard from "@/components/jobcard";
import { Job } from "@/types/job";
import RoleSelectModal from "@/components/roleselector";
import { useAuth } from "@/context/AuthContext";

// If you placed these in "@/api/user", keep this import:
import { getAuthMe, updateUserRole } from "@/api/user";
// If getAuthMe actually lives in "@/api/session", swap the import to:
// import { fetchAuthMe as getAuthMe } from "@/api/session";

function normalizeRole(r?: string | null) {
  const raw = (r ?? "").trim().toLowerCase();
  if (!raw) return "Unknown";
  if (raw.includes("unknown") || raw.includes("unset")) return "Unknown";
  if (raw.includes("company")) return "Company";
  if (raw.includes("student")) return "Student";
  if (raw.includes("professor")) return "Professor";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function HomePage() {
  const { user, login } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Use existing RoleSelectModal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [patchingRole, setPatchingRole] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // 1) Bootstrap session from cookie (OAuth) or keep existing
        const me = await getAuthMe();
        console.log("✅ /api/auth/me:", me);

        const role = normalizeRole(me.role ?? me.roles);
        // hydrate AuthContext if not already
        if (!user) {
          login({
            access_token: localStorage.getItem("access_token") ?? "",
            refresh_token: localStorage.getItem("refresh_token") ?? "",
            user_name: me.user_name ?? "",
            email: me.email ?? "",
            roles: role,
          });
        }

        if (role === "Unknown") {
          setShowRoleModal(true);
        }
      } catch (err) {
        console.warn("⚠️ Not logged in (no cookie / auth):", err);
      }

      // 2) Load jobs
      try {
        const res = await fetch("http://localhost:8000/api/mock/findjob", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        setJobs(data);
      } catch (e) {
        console.error("Failed to load jobs:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [login, user]);

  // Called when user selects a role from RoleSelectModal
  async function handleRoleSelect(selected: string) {
    try {
      setPatchingRole(true);

      // RoleSelectModal passes lowercase (e.g., "student"), map to capitalized for backend
      const payloadRole =
        selected.toLowerCase() === "student"
          ? "Student"
          : selected.toLowerCase() === "company"
          ? "Company"
          : selected.toLowerCase() === "professor"
          ? "Professor"
          : "Student";

      await updateUserRole(payloadRole); // PATCH /api/user/role { role }

      setShowRoleModal(false);

      // Refresh local auth state from /auth/me after update
      try {
        const me = await getAuthMe();
        const role = normalizeRole(me.role ?? me.roles);
        login({
          access_token: localStorage.getItem("access_token") ?? "",
          refresh_token: localStorage.getItem("refresh_token") ?? "",
          user_name: me.user_name ?? "",
          email: me.email ?? "",
          roles: role,
        });
      } catch (e) {
        console.warn("Role patched but failed to refresh /auth/me:", e);
      }
    } catch (err) {
      console.error("Failed to update role:", err);
      // If you want, you can keep the modal open and show a toast/UI error here
    } finally {
      setPatchingRole(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-gray-500">Loading jobs and session…</div>;
  }

  return (
    <main className="p-4 space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}

      {/* Use your existing RoleSelectModal */}
      <RoleSelectModal
        isOpen={showRoleModal}
        onClose={() => !patchingRole && setShowRoleModal(false)}
        onSelect={handleRoleSelect}
      />
    </main>
  );
}
