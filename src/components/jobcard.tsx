"use client";

import Link from "next/link";
import type { Job } from "@/types/job";
import { toPlainText } from "@/utils/safeText";

interface JobCardProps {
  job: Job;
  href?: string;
}

const GREEN = "#5D9252";

function humanize(value?: string | null) {
  if (!value) return null;
  return value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, (_match, a: string, b: string) => `${a} ${b}`)
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeLocation(value?: string | null) {
  if (!value) return null;
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !/^to be added$/i.test(part));
  if (parts.length === 0) return null;
  return parts.join(", ");
}

export default function JobCard({ job, href }: JobCardProps) {
  const title = toPlainText(job.job_title ?? job.position ?? "Untitled Role", "Untitled Role");
  const companyName = toPlainText(job.company_name ?? "Company", "Company");
  const locationRaw = sanitizeLocation(job.company_location) ?? sanitizeLocation(job.location);
  const location = locationRaw ? toPlainText(locationRaw, locationRaw) : null;
  const jobTypeRaw = humanize(job.jobType);
  const jobType = jobTypeRaw ? toPlainText(jobTypeRaw, jobTypeRaw) : null;
  const workplaceRaw = humanize(job.work_place);
  const workplace = workplaceRaw ? toPlainText(workplaceRaw, workplaceRaw) : null;
  const postedAgoText = job.posted_ago ? toPlainText(job.posted_ago, job.posted_ago) : "";
  const postedAgo = postedAgoText ? `Posted ${postedAgoText}` : "";
  const positions = typeof job.available_position === "number" ? job.available_position : null;
  const minSalary = typeof job.minimum_expected_salary === "number" ? job.minimum_expected_salary : null;
  const maxSalary = typeof job.maximum_expected_salary === "number" ? job.maximum_expected_salary : null;
  const salary =
    minSalary !== null && maxSalary !== null ? `Expected Salary: ${minSalary.toLocaleString()} - ${maxSalary.toLocaleString()}` : null;

  const card = (
    <div
      className="
        flex justify-between items-center 
        border-2 rounded-2xl p-4 bg-white shadow-sm gap-4

        cursor-pointer
        transition-all duration-300
        hover:shadow-xl hover:-translate-y-1
      "
      style={{ borderColor: GREEN }}
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-900 text-white font-semibold text-lg">
            {companyName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
            </div>
            <p className="text-sm text-gray-700">{companyName}</p>
            {location && <p className="text-sm text-gray-600">{location}</p>}
            {postedAgo && <p className="text-xs text-gray-500 mt-1">{postedAgo}</p>}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {jobType && (
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              {jobType}
            </span>
          )}
          {workplace && <span className="rounded-full border border-gray-200 px-3 py-1 text-gray-600">{workplace}</span>}
        </div>

        <div className="mt-3 text-sm text-gray-700 space-y-1">
          {positions !== null && <p>Available Positions: {positions}</p>}
          {salary && <p>{salary}</p>}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="
          block 
          focus-visible:outline-none 
          focus-visible:ring-2 
          focus-visible:ring-emerald-600 
          rounded-2xl
        "
      >
        {card}
      </Link>
    );
  }

  return card;
}
