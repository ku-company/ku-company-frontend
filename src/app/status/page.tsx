"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { API_BASE, buildInit } from "@/api/base";
import notify from "@/lib/toast";

/* ---------- Types ---------- */
type UIStatus = "Approved" | "Confirmed" | "Declined" | "Pending";

type Application = {
  id: number;
  company_name: string;
  company_user_id?: number;
  position: string;
  applied_date: string;
  status: UIStatus;     // สถานะที่แสดงในตาราง
  canConfirm: boolean;  // อนุญาตให้กด Confirm หรือไม่ (บริษัทต้อง approved/confirmed)
};

const API_URL = `${API_BASE}/api`;

/* ---------- UI helpers ---------- */
function StatusBadge({ status }: { status: UIStatus }) {
  const base = "px-3 py-1 rounded-md text-sm font-semibold";
  if (status === "Approved")
    return <span className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-300`}>Approved</span>;
  if (status === "Confirmed")
    return <span className={`${base} bg-green-100 text-green-700 border border-green-300`}>Confirmed</span>;
  if (status === "Pending")
    return <span className={`${base} bg-gray-100 text-gray-700 border border-gray-300`}>Pending</span>;
  return <span className={`${base} bg-red-100 text-red-700 border border-red-300`}>Declined</span>;
}

/* ---------- Page ---------- */
export default function AppliedCompanyStatusPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isReady } = useAuth();

  useEffect(() => {
    const fetchApplications = async () => {
      if (!isReady) return;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_URL}/employee/my-applications`,
          buildInit({ method: "GET", credentials: "include" })
        );
        if (!res.ok) {
          const raw = await res.text().catch(() => "");
          let message = "";
          try {
            const parsed = JSON.parse(raw);
            message = parsed?.message || "";
          } catch {}
          // Gracefully handle "No applications found" without noisy console errors
          if (res.status === 400 && /no applications found/i.test(message || raw)) {
            setApplications([]);
            setLoading(false);
            return;
          }
          console.warn("Request for my-applications failed:", res.status, message || raw);
          setLoading(false);
          return;
        }

        const json = await res.json();
        const data: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

        const mapped: Application[] = data.map((a) => {
          const position =
            a?.job_post?.position ??
            a?.job_post?.job_title ??
            a?.position ??
            "—";

          const companyName =
            a?.job_post?.company?.company_name ??
            a?.job_post?.company_name ??
            `Company #${a?.job_post?.company_id ?? "-"}`;

          const companyUserId = a?.job_post?.company?.user_id ?? a?.job_post?.company_user_id ?? null;

          const appliedAt = a?.applied_at ?? a?.created_at ?? null;

          const emp = (a?.employee_send_status ?? "").toString().toLowerCase();
          const comp = (a?.company_send_status ?? "").toString().toLowerCase();

          // สถานะสำหรับคอลัมน์ UI
          let status: UIStatus = "Pending";
          if (emp === "confirmed") status = "Confirmed";
          else if (emp === "rejected") status = "Declined";
          else if (comp === "approved" || comp === "confirmed") status = "Approved";

          // อนุญาตให้กด Confirm เมื่อบริษัทเป็น approved หรือ confirmed
          const canConfirm = comp === "approved" || comp === "confirmed";

          return {
            id: Number(a?.id ?? 0),
            company_name: companyName,
            company_user_id: companyUserId || undefined,
            position,
            applied_date: appliedAt ? new Date(appliedAt).toLocaleDateString() : "—",
            status,
            canConfirm,
          };
        });

        setApplications(mapped);
      } catch (err) {
        console.error("🔥 Error while fetching applications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, isReady]);

  /* ---------- Actions ---------- */
  const handleConfirm = async (id: number) => {
    if (!user) return;
    try {
      const res = await fetch(
        `${API_URL}/employee/job-applications/${id}/confirm`,
        buildInit({ method: "POST", credentials: "include" })
      );

      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "Confirmed", canConfirm: false } : a))
        );
        notify.success("Status updated: Confirmed");
      } else {
        const msg = await res.text();
        console.error("Confirm failed:", msg);
        try {
          const j = JSON.parse(msg);
          notify.error(j?.message || msg);
        } catch {
          notify.error(msg);
        }
      }
    } catch (err) {
      console.error("Confirm error:", err);
      notify.error("Confirm failed. Please try again.");
    }
  };

  const handleCancel = async (id: number) => {
    if (!user) return;
    try {
      const res = await fetch(
        `${API_URL}/employee/cancel-application/${id}`,
        buildInit({ method: "DELETE", credentials: "include" })
      );
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
        notify.success("Application cancelled");
      } else {
        const msg = await res.text();
        console.error("Cancel failed:", msg);
        notify.error("Cancel failed: " + msg);
      }
    } catch (err) {
      console.error("Cancel error:", err);
      notify.error("Cancel failed. Please try again.");
    }
  };

  /* ---------- UI ---------- */
  if (loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        <div>
          <p>Loading applications...</p>
          <p className="text-sm text-gray-400">(See browser console for debug logs)</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Please log in to view your applications.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-10 border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Applied Company Status</h1>

        {applications.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No applications found.</p>
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
                  <tr key={app.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-medium">
                      {app.company_user_id ? (
                        <Link className="hover:underline cursor-pointer" href={`/profile/${app.company_user_id}`} target="_blank" rel="noopener noreferrer">
                          {app.company_name}
                        </Link>
                      ) : (
                        app.company_name
                      )}
                    </td>
                    <td className="p-4">{app.position}</td>
                    <td className="p-4">
                      <span className="bg-gray-100 rounded-md px-3 py-1 text-sm">{app.applied_date}</span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-4 text-center">
                      {app.status === "Approved" ? (
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => (app.canConfirm ? handleConfirm(app.id) : undefined)}
                            disabled={!app.canConfirm}
                            title={!app.canConfirm ? "Company must confirm before you can confirm." : undefined}
                            className={`px-3 py-1 rounded-md text-white transition ${
                              app.canConfirm ? "bg-[#558E46] hover:bg-[#4a7b3d]" : "bg-gray-300 cursor-not-allowed"
                            }`}
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
