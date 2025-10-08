"use client";
import { useState } from "react";

type Application = {
  id: number;
  company: string;
  position: string;
  appliedDate: string;
  status: "Offered" | "Confirmed" | "Declined";
};

export default function AppliedCompanyStatusPage() {
  const [applications, setApplications] = useState<Application[]>([
    {
      id: 1,
      company: "Siam Commercial Bank",
      position: "Machine Learning Engineer",
      appliedDate: "Oct 2, 2025",
      status: "Offered",
    },
    {
      id: 2,
      company: "Agoda",
      position: "Backend Developer",
      appliedDate: "Sep 10, 2025",
      status: "Confirmed",
    },
    {
      id: 3,
      company: "LineMan",
      position: "Data Analyst",
      appliedDate: "Aug 22, 2025",
      status: "Declined",
    },
  ]);

  const updateStatus = (id: number, newStatus: Application["status"]) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status: newStatus } : app
      )
    );
  };

  // Function to show colored status button
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

  return (
    <main className="min-h-screen bg-gray-50 py-10 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-10 border border-gray-100">
        {/* Header */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          Applied Company Status
        </h1>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
          <table className="w-full border-collapse text-gray-800">
            <thead>
              <tr className="bg-[#558E46] text-white text-left">
                <th className="p-4 font-semibold">Company</th>
                <th className="p-4 font-semibold">Position</th>
                <th className="p-4 font-semibold">Applied Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, i) => (
                <tr
                  key={app.id}
                  className={`border-b hover:bg-gray-50 transition ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/70"
                  }`}
                >
                  <td className="p-4 font-medium">{app.company}</td>
                  <td className="p-4">{app.position}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 rounded-md px-3 py-1 text-sm">
                      {app.appliedDate}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="p-4 text-center">
                    {app.status === "Offered" ? (
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => updateStatus(app.id, "Confirmed")}
                          className="bg-[#558E46] text-white px-3 py-1 rounded-md hover:bg-[#4a7b3d] transition"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, "Declined")}
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
