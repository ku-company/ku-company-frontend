"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

// Mock data (replace with API data)
const metrics = [
  { label: "Active Jobs", value: 0 },
  { label: "New Candidates (7d)", value: 0 },
  { label: "Interviews Scheduled (7d)", value: 0 },
  { label: "Time-to-Hire (median)", value: "--" },
];

const upcomingTasks = [
  {
    id: 1,
    title: "Review 5 new candidates — Machine Learning Engineer",
    due: "Today • 4:30 PM",
  },
  {
    id: 2,
    title: "Interview with Emily Chen — Tomorrow • 10:00 AM",
    due: "",
  },
];

const JobPipelineMiniBars: React.FC = () => {
  const bars = [28, 52, 78, 94, 60];
  return (
    <div className="grid h-40 grid-cols-5 items-end gap-3">
      {bars.map((h, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div
            className="w-10 rounded-md bg-gray-300"
            style={{ height: `${h}%` }}
            aria-hidden
          />
          <span className="text-xs text-gray-500">{i + 1}</span>
        </div>
      ))}
    </div>
  );
};

export default function CompanyDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      {/* HERO ------------------------------------------------------------ */}
      <div className="relative h-96 overflow-hidden rounded-2xl shadow-lg">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/company-hero.jpg')" }}
        />
        {/* Gradient overlay (darker on right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-midgreen-900/60 to-midgreen-900/90" />

        {/* Content wrapper */}
        <div className="relative min-h-[280px] md:min-h-[320px]">
          {/* Right-half box */}
          <div className="absolute inset-y-0 right-0 w-full md:w-1/2 flex items-center">
            <div className="w-full p-6 md:p-8 lg:p-10 text-left text-white">
              <h1 className="text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl">
                GROW YOUR TEAM,
                <br />
                THRIVE YOUR BUSINESS
              </h1>
              <p className="mt-4 max-w-xl text-white/90">
                EXCLUSIVE EMPLOYER RESOURCES AND CPE /
                <br className="hidden sm:block" /> SKE PROGRAMS
              </p>
            </div>
          </div>

          {/* CTA pinned to bottom-right */}
          <Link
            href="/company/jobs/create"
            className="absolute bottom-20 right-4 inline-flex items-center gap-2 rounded-md bg-midgreen-200 px-4 py-2 font-medium text-midgreen-900 shadow-sm hover:bg-midgreen-100 md:bottom-[-2.5rem] md:right-6"
          >
            CREATE JOB POSTING
            <span className="-mr-1 inline-flex rounded bg-midgreen-900/10 p-1">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>

      {/* CONTENT GRID ---------------------------------------------------- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column: empty-state + mini chart */}
        <div className="rounded-2xl border-2 border-midgreen-300 bg-white p-6 shadow-sm lg:col-span-4">
          <h3 className="text-xl font-semibold">
            No active jobs yet — create your first job to start hiring.
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Kickstart your pipeline and invite your team.
          </p>
          <div className="mt-6">
            <JobPipelineMiniBars />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/company/jobs/create"
              className="inline-flex items-center gap-2 rounded-md bg-midgreen-600 px-4 py-2 text-white hover:bg-midgreen-700"
            >
              <Plus className="h-4 w-4" /> Create Job
            </Link>
            <Link
              href="/company/jobs"
              className="text-sm font-medium text-midgreen-700 hover:text-midgreen-800"
            >
              View by jobs <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right column: metrics + tasks */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {metrics.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl border-2 border-midgreen-300 bg-white p-5 text-center shadow-sm"
              >
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                <div className="mt-1 text-xs text-gray-500">— {label}</div>
              </div>
            ))}
          </div>

          {/* Upcoming tasks */}
          <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
            <h4 className="text-2xl font-semibold">Upcoming Tasks</h4>
            <ul className="mt-4 space-y-4">
              {upcomingTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <span className="mt-2 inline-flex h-2 w-2 rounded-full bg-gray-800" />
                  <div>
                    <p className="font-medium leading-snug">{t.title}</p>
                    {t.due && <p className="text-sm text-gray-500">{t.due}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
