"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock data
const stats = [
  { label: "Job Postings", value: 8 },
  { label: "Total Applicants", value: 125 },
  { label: "New Applicants", value: 12 },
  { label: "Shortlisted", value: 4 },
];

const activeJobs = [
  { title: "Machine Learning Engineer", status: "Active" },
  { title: "Full Stack Developer", status: "Active" },
  { title: "Data Engineer", status: "Active" },
];

const applicants = [
  { name: "John Doe", role: "Machine Learning Engineer" },
  { name: "Jane Smith", role: "End Share Developer" },
  { name: "Michael Brown", role: "Machine Learning Engineer" },
  { name: "Emily Johnson", role: "Data Engineer" },
];

const analyticsData = [
  { stage: "Applied", count: 20 },
  { stage: "Interview", count: 35 },
  { stage: "Offer", count: 50 },
  { stage: "Hired", count: 45 },
];

export default function CompanyDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-700 text-white font-bold">
            SCB
          </div>
          <div className="flex flex-wrap gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex min-w-[120px] flex-col items-center justify-center rounded-lg border-2 border-midgreen-300 bg-white px-4 py-2 text-center shadow-sm"
              >
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">— {s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/company/jobs/create"
          className="inline-flex items-center gap-2 rounded-full bg-midgreen-600 px-5 py-2 text-white shadow hover:bg-midgreen-700"
        >
          + Create Job Posting
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Active Job Postings */}
        <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Active Job Postings</h2>
          <ul className="space-y-3">
            {activeJobs.map((job) => (
              <li
                key={job.title}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2"
              >
                <span>{job.title}</span>
                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {job.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Applicants */}
        <div className="rounded-2xl border border-midgreen-400 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Recent Applicants</h2>
          <ul className="space-y-3">
            {applicants.map((app) => (
              <li
                key={app.name}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2"
              >
                <div>
                  <span className="font-medium">{app.name}</span> – {app.role}
                </div>
                <button className="rounded border border-midgreen-500 px-3 py-1 text-sm font-medium text-midgreen-700 hover:bg-midgreen-50">
                  View Profile
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Analytics Snapshot */}
      <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">Analytics Snapshot</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="stage" stroke="#374151" />
              <YAxis stroke="#374151" />
              <Tooltip />
              <Bar dataKey="count" fill="#5D9252" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}