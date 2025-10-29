"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE, buildInit } from "@/api/base";

type Application = {
  id: number;
  company_name: string;
  position: string;
  applied_date: string;
  status: "Approved" | "Confirmed" | "Declined" | "Pending";
};

const API_URL = `${API_BASE}/api`;

export default function AppliedCompanyStatusPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isReady } = useAuth();

  useEffect(() => {
    const fetchApplications = async () => {
      if (!isReady) return;
      if (!user) {
        console.warn("⚠️ No user context. Please log in first.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_URL}/employee/my-applications`,
          buildInit({ method: "GET", credentials: "include" })
        );

        if (!res.ok) {
          const text = await res.text();
          console.error("❌ Request failed:", res.status, text);
          setLoading(false);
          return;
        }

        const json = await res.json();
        console.log("📦 Raw API Response:", json);

        const mapped: Application[] = (json?.data ?? []).map((a: any) => {
          // ✅ Position fallback
          const position =
            a?.job_post?.position ??
            a?.job_post?.job_title ??
            a?.position ??
            "—";

          // ✅ Company name fallback (เพราะ backend ไม่มี company object)
          const companyName =
            a?.job_post?.company?.company_name ??
            a?.job_post?.company_name ??
            `Company #${a?.job_post?.company_id ?? "-"}`;

          // ✅ Applied date
          const appliedAt = a?.applied_at ?? a?.created_at ?? null;

          // ✅ Normalize statuses
          const emp = (a?.employee_send_status ?? "").toString().toLowerCase();
          const comp = (a?.company_send_status ?? "").toString().toLowerCase();

          let status: Application["status"] = "Pending";
          if (emp === "confirmed") status = "Confirmed";
          else if (emp === "rejected") status = "Declined";
          else if (comp === "approved" || comp === "confirmed") status = "Approved";

          return {
            id: Number(a?.id ?? 0),
            company_name: companyName,
            position,
            applied_date: appliedAt
              ? new Date(appliedAt).toLocaleDateString()
              : "—",
            status,
          };
        });

        console.log("✅ Mapped applications:", mapped);
        setApplications(mapped);
      } catch (err) {
        console.error("🔥 Error while fetching applications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, isReady]);

  // ─────────── Confirm handler ───────────
  const handleConfirm = async (id: number) => {
    if (!user) return;
    try {
      const res = await fetch(
        `${API_URL}/employee/job-applications/${id}/confirm`,
        buildInit({ method: "POST", credentials: "include" })
      );

      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "Confirmed" } : a))
        );
      } else {
        console.error("Confirm failed:", await res.text());
      }
    } catch (err) {
      console.error("Confirm error:", err);
    }
  };

  // ─────────── Cancel handler ───────────
  const handleCancel = async (id: number) => {
    if (!user) return;
    try {
      const res = await fetch(
        `${API_URL}/employee/cancel-application/${id}`,
        buildInit({ method: "DELETE", credentials: "include" })
      );

      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
      } else {
        console.error("Cancel failed:", await res.text());
      }
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  // ─────────── Status Badge ───────────
  const StatusBadge = ({ status }: { status: Application["status"] }) => {
    const base = "px-3 py-1 rounded-md text-sm font-semibold";
    if (status === "Approved")
      return (
        <span
          className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-300`}
        >
          Approved
        </span>
      );
    if (status === "Confirmed")
      return (
        <span
          className={`${base} bg-green-100 text-green-700 border border-green-300`}
        >
          Confirmed
        </span>
      );
    if (status === "Pending")
      return (
        <span
          className={`${base} bg-gray-100 text-gray-700 border border-gray-300`}
        >
          Pending
        </span>
      );
    return (
      <span className={`${base} bg-red-100 text-red-700 border border-red-300`}>
        Declined
      </span>
    );
  };

  // ─────────── Loading & Auth ───────────
  if (loading || !isReady)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        <div>
          <p>Loading applications...</p>
          <p className="text-sm text-gray-400">
            (See browser console for debug logs)
          </p>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Please log in to view your applications.
      </div>
    );

  // ─────────── Main UI ───────────
  return (
    <main className="min-h-screen bg-gray-50 py-10 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-10 border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          Applied Company Status
        </h1>

        {applications.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            No applications found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
            <table className="w-full border-collapse text-gray-800">
              <thead>
                <tr className="bg-[#558E46] text-white text-left">
                  <th className="p-4">Company</th>
                  <th className="p-4">Position</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-4 font-medium">{app.company_name}</td>
                    <td className="p-4">{app.position}</td>
                    <td className="p-4">
                      <span className="bg-gray-100 rounded-md px-3 py-1 text-sm">
                        {app.applied_date}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-4 text-center">
                      {app.status === "Approved" ? (
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleConfirm(app.id)}
                            className="bg-[#558E46] text-white px-3 py-1 rounded-md hover:bg-[#4a7b3d] transition"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleCancel(app.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : app.status === "Pending" ? (
                        <button
                          onClick={() => handleCancel(app.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">No Action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
