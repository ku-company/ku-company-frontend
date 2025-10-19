"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type Application = {
  id: number;
  company_name: string;
  position: string;
  applied_date: string;
  status: "Offered" | "Confirmed" | "Declined";
};

const BASE_URL = "http://127.0.0.1:8000/api";

export default function AppliedCompanyStatusPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.access_token) {
        console.warn("⚠️ No token found in user context. Please log in first.");
        setLoading(false);
        return;
      }

      console.log("🚀 Starting fetchApplications...");
      console.log("🔑 Using token:", user.access_token);

      try {
        const res = await fetch(`${BASE_URL}/employee/my-applications`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("📨 Response received. Status:", res.status);

        if (!res.ok) {
          const text = await res.text();

          // ✅ Handle case: "No applications found"
          if (res.status === 400 && text.includes("No applications found")) {
            console.warn("ℹ️ No applications found for this user.");
            setApplications([]); // safe fallback
            setLoading(false);
            return;
          }

          console.error("❌ Request failed:", res.status, text);
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log("✅ Application data fetched successfully:", data);
        setApplications(data);
      } catch (err) {
        console.error("🔥 Error while fetching applications:", err);
      } finally {
        setLoading(false);
        console.log("✅ Fetch complete.");
      }
    };

    fetchApplications();
  }, [user]);

  // ──────────────────────── Confirm handler ────────────────────────
  const handleConfirm = async (id: number) => {
    if (!user?.access_token) return;

    console.log("🟢 Confirming job application:", id);
    try {
      const res = await fetch(`${BASE_URL}/company/job-applications/${id}/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Confirm Response:", res.status);
      if (!res.ok) {
        const text = await res.text();
        console.error("Confirm failed:", text);
        return;
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Confirmed" } : a))
      );
      console.log("✅ Confirmed successfully.");
    } catch (err) {
      console.error("Confirm error:", err);
    }
  };

  // ──────────────────────── Cancel handler ────────────────────────
  const handleCancel = async (id: number) => {
    if (!user?.access_token) return;

    console.log("🔴 Cancelling job application:", id);
    try {
      const res = await fetch(`${BASE_URL}/employee/cancel-application/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Cancel Response:", res.status);
      if (!res.ok) {
        const text = await res.text();
        console.error("Cancel failed:", text);
        return;
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Declined" } : a))
      );
      console.log("✅ Cancelled successfully.");
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  // ──────────────────────── Status badge ────────────────────────
  const StatusBadge = ({ status }: { status: Application["status"] }) => {
    const base = "px-3 py-1 rounded-md text-sm font-semibold";
    if (status === "Offered")
      return (
        <span className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-300`}>
          Offered
        </span>
      );
    if (status === "Confirmed")
      return (
        <span className={`${base} bg-green-100 text-green-700 border border-green-300`}>
          Confirmed
        </span>
      );
    return (
      <span className={`${base} bg-red-100 text-red-700 border border-red-300`}>
        Declined
      </span>
    );
  };

  // ──────────────────────── Loading State ────────────────────────
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        <div>
          <p>Loading applications...</p>
          <p className="text-sm text-gray-400">(See browser console for debug logs)</p>
        </div>
      </div>
    );

  // ──────────────────────── Not Logged In ────────────────────────
  if (!user?.access_token)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Please log in to view your applications.
      </div>
    );

  // ──────────────────────── Main UI ────────────────────────
  return (
    <main className="min-h-screen bg-gray-50 py-10 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-10 border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          Applied Company Status
        </h1>

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
                      {app.status === "Offered" ? (
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
