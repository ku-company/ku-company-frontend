"use client";

import { useState } from "react";

export default function JobPostForm({ onSubmit }: { onSubmit: (job: any) => void }) {
  const jobTypes = [
    { label: "Full Time", value: "FullTime" },
    { label: "Part Time", value: "PartTime" },
    { label: "Internship", value: "Internship" },
    { label: "Contract", value: "Contract" },
  ];

  const positions = [
    { label: "Backend Developer", value: "Backend_Developer" },
    { label: "Frontend Developer", value: "Frontend_Developer" },
    { label: "Fullstack Developer", value: "Fullstack_Developer" },
  ];

  const [jobType, setJobType] = useState("Internship");
  const [position, setPosition] = useState("Backend_Developer");
  const [details, setDetails] = useState("");
  const [positionsAvailable, setPositionsAvailable] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      jobType,
      title: position,
      details,
      positionsAvailable,
    });
    setDetails("");
    setPositionsAvailable(1);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 p-6 shadow-sm space-y-5 transition-all duration-300 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-[#5b8f5b] mb-2">
        New Job Posting
      </h3>

      {/* Job Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Job Type
        </label>
        <select
          className="select select-bordered w-full rounded-md border-gray-200 focus:border-[#5b8f5b] focus:outline-none"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
        >
          {jobTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Position */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Position
        </label>
        <select
          className="select select-bordered w-full rounded-md border-gray-200 focus:border-[#5b8f5b]"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          {positions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Description
        </label>
        <textarea
          placeholder="More Details here..."
          className="textarea textarea-bordered w-full rounded-md border-gray-200 focus:border-[#5b8f5b] focus:ring-0"
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          required
        />
      </div>

      {/* Positions & Post button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-100 pt-4">
        <label className="text-sm font-semibold text-gray-700">
          Number of Positions Available
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            className="input input-bordered input-sm w-20 text-center border-gray-200 focus:border-[#5b8f5b]"
            value={positionsAvailable}
            onChange={(e) => setPositionsAvailable(Number(e.target.value))}
          />
          <button
            type="submit"
            className="btn btn-sm bg-[#5b8f5b] text-white rounded-full px-6 hover:bg-[#4a7a4a] transition"
          >
            Post
          </button>
        </div>
      </div>
    </form>
  );
}
