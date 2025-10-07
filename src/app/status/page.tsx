"use client";
import { useState } from "react";

type Application = {
  id: number;
  company: string;
  position: string;
  appliedDate: string;
  status: "Interview Scheduled" | "Pending" | "Rejected";
  action: string;
};

const applications: Application[] = [
  {
    id: 1,
    company: "Siam Commercial Bank",
    position: "Machine Learning Engineer",
    appliedDate: "Oct 2, 2025",
    status: "Interview Scheduled",
    action: "View Details",
  },
  {
    id: 2,
    company: "Agoda",
    position: "Backend Developer",
    appliedDate: "Sep 10, 2025",
    status: "Pending",
    action: "Cancel",
  },
  {
    id: 3,
    company: "LineMan",
    position: "Data Analyst",
    appliedDate: "Aug 22, 2025",
    status: "Rejected",
    action: "View Feedback",
  },
];

export default function AppliedStatusPage() {
  const [filter, setFilter] = useState("All Positions");

  const filtered =
    filter === "All Positions"
      ? applications
      : applications.filter((a) => a.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Interview Scheduled":
        return (
          <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 text-sm font-medium flex items-center gap-1">
            ✅ {status}
          </span>
        );
      case "Pending":
        return (
          <span className="px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 text-sm font-medium flex items-center gap-1">
            ⏳ {status}
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 text-sm font-medium flex items-center gap-1">
            ❌ {status}
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 font-sans">
      {/* Outer container for layout spacing */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-10 border border-gray-100">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800">
            Applied Company Status
          </h1>
        </header>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {["All Positions", "Approved", "Rejected", "Pending"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-full font-medium transition ${
                filter === tab
                  ? "bg-[#558E46] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                <th className="p-4 font-semibold">Company</th>
                <th className="p-4 font-semibold">Position</th>
                <th className="p-4 font-semibold">Applied Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => (
                <tr
                  key={app.id}
                  className={`border-b hover:bg-gray-50 transition ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/70"
                  }`}
                >
                  <td className="p-4">{app.company}</td>
                  <td className="p-4">{app.position}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 rounded-md px-3 py-1 text-sm">
                      {app.appliedDate}
                    </span>
                  </td>
                  <td className="p-4">{getStatusBadge(app.status)}</td>
                  <td className="p-4">
                    <button className="text-[#558E46] font-semibold hover:underline">
                      {app.action}
                    </button>
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
