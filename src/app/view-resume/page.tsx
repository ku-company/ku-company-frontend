"use client";
import { useState } from "react";

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
  const [applications, setApplications] = useState<Application[]>([
    {
      id: 1,
      name: "Smith Samantha",
      email: "smith.op@ku.th",
      position: "Machine Learning Engineer",
      appliedDate: "Oct 1, 2025",
      resumeLink: "#",
      status: "Approved",
    },
    {
      id: 2,
      name: "John Tan",
      email: "emily.chen@ku.th",
      position: "Machine Learning Developer",
      appliedDate: "Sep 27, 2025",
      resumeLink: "#",
      status: "Rejected",
    },
    {
      id: 3,
      name: "John Tan",
      email: "john.tan@ku.th",
      position: "Backend Developer",
      appliedDate: "Sep 20, 2025",
      resumeLink: "#",
      status: "Approved",
    },
    {
      id: 4,
      name: "Michael Wong",
      email: "michael.wong@ku.th",
      position: "Data Analyst",
      appliedDate: "Sep 18, 2025",
      resumeLink: "#",
      status: "Pending",
    },
  ]);

  // state for filter
  const [filter, setFilter] = useState<"All Positions" | "Approved" | "Rejected" | "Pending">(
    "All Positions"
  );

  const updateStatus = (id: number, newStatus: Application["status"]) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status: newStatus } : app
      )
    );
  };

  // filter logic
  const filteredApplications =
    filter === "All Positions"
      ? applications
      : applications.filter((app) => app.status === filter);

  return (
    <main className="min-h-screen bg-gray-50 py-10 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-10 border border-gray-100">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800">
            Resume in the Application
          </h1>
        </header>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6 flex-wrap">
          {["All Positions", "Approved", "Rejected", "Pending"].map((tab) => (
            <button
              key={tab}
              onClick={() =>
                setFilter(tab as "All Positions" | "Approved" | "Rejected" | "Pending")
              }
              className={`px-6 py-2 rounded-full font-medium transition ${
                filter === tab
                  ? "bg-[#558E46] text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
          <table className="w-full border-collapse text-gray-800">
            <thead>
              <tr className="bg-[#558E46] text-white text-left">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Position</th>
                <th className="p-4 font-semibold">Applied Date</th>
                <th className="p-4 font-semibold">Resume</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app, i) => (
                <tr
                  key={app.id}
                  className={`border-b hover:bg-gray-50 transition ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/70"
                  }`}
                >
                  <td className="p-4 font-medium">{app.name}</td>
                  <td className="p-4">{app.email}</td>
                  <td className="p-4">{app.position}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 rounded-md px-3 py-1 text-sm">
                      {app.appliedDate}
                    </span>
                  </td>
                  <td className="p-4">
                    <a
                      href={app.resumeLink}
                      className="text-[#558E46] hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Resume
                    </a>
                  </td>
                  <td className="p-4">
                    <select
                      value={app.status}
                      onChange={(e) =>
                        updateStatus(
                          app.id,
                          e.target.value as Application["status"]
                        )
                      }
                      className={`rounded-md px-3 py-1 text-sm font-medium border ${
                        app.status === "Approved"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : app.status === "Rejected"
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-yellow-100 text-yellow-700 border-yellow-300"
                      }`}
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

        {/* Pagination */}
        <div className="flex justify-end items-center gap-3 mt-6 text-gray-600">
          <button className="hover:underline">Previous</button>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                className={`px-2 ${
                  n === 1
                    ? "font-bold text-[#558E46]"
                    : "hover:text-[#558E46] hover:underline"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button className="hover:underline">Next</button>
        </div>
      </div>
    </main>
  );
}
