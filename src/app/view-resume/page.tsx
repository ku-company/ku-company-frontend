"use client";
import { useEffect, useState } from "react";
import { getAllApplications, updateApplicationStatus } from "@/api/companyapplications";

type Application = {
  id: number;
  name: string;
  email: string;
  position: string;
  appliedDate: string;
  resumeLink: string;
  status: "Approved" | "Rejected" | "Pending";
};

export default function ResumeInApplicationPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<"All Positions" | "Approved" | "Rejected" | "Pending">("All Positions");

  useEffect(() => {
    getAllApplications()
      .then((data) => setApplications(data))
      .catch((err) => console.error("Failed to fetch applications:", err));
  }, []);

  const updateStatusLocal = (id: number, newStatus: Application["status"]) => {
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app)));
    updateApplicationStatus(id, newStatus).catch((error) => {
      console.error("Failed to update application status:", error);
      setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: "Pending" } : app)));
    });
  };

  const filteredApplications =
    filter === "All Positions" ? applications : applications.filter((app) => app.status === filter);

  return (
    <main className="min-h-screen bg-gray-50 py-10 font-sans">
      <div className="mx-auto max-w-6xl rounded-2xl border border-gray-100 bg-white p-10 shadow-md">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-800">Resume in the Application</h1>
        </header>

        <div className="mb-6 flex flex-wrap gap-4">
          {["All Positions", "Approved", "Rejected", "Pending"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-6 py-2 rounded-full font-medium transition ${
                filter === tab ? "bg-[#558E46] text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {filteredApplications.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-600 shadow-sm">
            There are no applications.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
            <table className="w-full border-collapse text-gray-800">
              <thead>
                <tr className="text-left text-white" style={{ backgroundColor: "#558E46" }}>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Position</th>
                  <th className="p-4 font-semibold">Applied Date</th>
                  <th className="p-4 font-semibold">Resume</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-medium">{app.name}</td>
                    <td className="p-4">{app.email}</td>
                    <td className="p-4">{app.position}</td>
                    <td className="p-4"><span className="rounded-md bg-gray-100 px-3 py-1 text-sm">{app.appliedDate}</span></td>
                    <td className="p-4"><a href={app.resumeLink} className="font-medium text-[#558E46] hover:underline" target="_blank" rel="noopener noreferrer">Resume</a></td>
                    <td className="p-4">
                      <select
                        value={app.status}
                        onChange={(e) => updateStatusLocal(app.id, e.target.value as Application["status"])}
                        className="rounded-md border px-3 py-1 text-sm font-medium"
                      >
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredApplications.length > 0 && (
          <div className="mt-6 flex items-center justify-end gap-3 text-gray-600">
            <button className="hover:underline">Previous</button>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} className={`px-2 ${n === 1 ? "font-bold text-[#558E46]" : "hover:text-[#558E46] hover:underline"}`}>
                  {n}
                </button>
              ))}
            </div>
            <button className="hover:underline">Next</button>
          </div>
        )}
      </div>
    </main>
  );
}
