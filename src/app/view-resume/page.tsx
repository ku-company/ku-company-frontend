"use client";
import { useEffect, useState } from "react";
import {
  getAllApplications,
  updateApplicationStatus,
} from "@/api/companyapplications";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

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
  const [filter, setFilter] = useState<
    "All" | "Approved" | "Rejected" | "Pending"
  >("All");

  useEffect(() => {
    getAllApplications()
      .then((data) => setApplications(data))
      .catch((err) => console.error("Failed to fetch applications:", err));
  }, []);

  const updateStatus = async (id: number, newStatus: Application["status"]) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    try {
      await updateApplicationStatus(id, newStatus);
    } catch (error) {
      console.error("Failed to update application status:", error);
    }
  };

  const filtered =
    filter === "All"
      ? applications
      : applications.filter((app) => app.status === filter);

  const statusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case "Rejected":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f9f7] py-12 px-4 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#558E46] tracking-tight">
              Applications Overview
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Review and manage applicant resumes by status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Approved", "Rejected", "Pending"].map((tab) => (
              <button
                key={tab}
                onClick={() =>
                  setFilter(tab as "All" | "Approved" | "Rejected" | "Pending")
                }
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === tab
                    ? "bg-[#558E46] text-white shadow-md"
                    : "text-[#558E46] border border-[#558E46]/40 hover:bg-[#558E46]/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-[#558E46] text-white">
                <tr>
                  <th className="font-semibold text-sm py-4">Name</th>
                  <th className="font-semibold text-sm">Email</th>
                  <th className="font-semibold text-sm">Position</th>
                  <th className="font-semibold text-sm">Applied</th>
                  <th className="font-semibold text-sm">Resume</th>
                  <th className="font-semibold text-sm text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr
                    key={app.id}
                    className={`transition-all ${
                      i % 2 === 0 ? "bg-white" : "bg-[#f8faf8]"
                    } hover:bg-[#eef7ee]`}
                  >
                    <td className="py-3 font-medium">{app.name}</td>
                    <td className="text-gray-600">{app.email}</td>
                    <td className="text-gray-700">{app.position}</td>
                    <td className="text-sm text-gray-500">{app.appliedDate}</td>
                    <td>
                      <a
                        href={app.resumeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#558E46] hover:underline font-medium"
                      >
                        View
                      </a>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {statusIcon(app.status)}
                        <select
                          value={app.status}
                          onChange={(e) =>
                            updateStatus(
                              app.id,
                              e.target.value as Application["status"]
                            )
                          }
                          className={`select select-sm border-0 rounded-full text-sm font-medium focus:outline-none ${
                            app.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : app.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="font-medium">No applications found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-6">
          <button className="px-3 py-1 rounded-full text-sm text-[#558E46] hover:bg-[#558E46]/10 transition">
            « Prev
          </button>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                n === 1
                  ? "bg-[#558E46] text-white shadow-sm"
                  : "text-[#558E46] hover:bg-[#558E46]/10"
              }`}
            >
              {n}
            </button>
          ))}
          <button className="px-3 py-1 rounded-full text-sm text-[#558E46] hover:bg-[#558E46]/10 transition">
            Next »
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-2">
          Showing <b>{filtered.length}</b> of {applications.length} applications
        </p>
      </div>
    </main>
  );
}
