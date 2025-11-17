"use client";

import { useState } from "react";
import { POSITION_OPTIONS, PositionEnum } from "@/types/positions";

export default function JobPostForm({ onSubmit }: { onSubmit: (job: any) => void }) {
  const jobTypes = [
    { label: "Full Time", value: "FullTime" },
    { label: "Part Time", value: "PartTime" },
    { label: "Internship", value: "Internship" },
    { label: "Contract", value: "Contract" },
  ];

  const positions = POSITION_OPTIONS;

  const [jobType, setJobType] = useState("Internship");
  const [position, setPosition] = useState(PositionEnum.BackendDeveloper);
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

  // ✨ Utility class เพื่อให้ขอบเป็นสีดำเสมอ
  const inputStyle =
    "border border-black rounded-md px-3 py-2 w-full " +
    "focus:outline-none focus:border-black focus:ring-1 focus:ring-black " +
    "!focus:border-black !focus:ring-black";

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-black rounded-lg p-6 shadow-sm bg-white space-y-6"
    >
      {/* Job Type */}
      <div>
        <label className="block text-sm font-semibold mb-1">Job Type</label>
        <select
          className={inputStyle}
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
        <label className="block text-sm font-semibold mb-1">Position</label>
        <select
          className={inputStyle}
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
        <label className="block text-sm font-semibold mb-1">Description</label>
        <textarea
          placeholder="More details here..."
          className={
            "border border-black rounded-md p-3 w-full " +
            "focus:outline-none focus:border-black focus:ring-1 focus:ring-black " +
            "!focus:border-black !focus:ring-black"
          }
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          required
        />
      </div>

      {/* Number of Positions */}
      <div className="flex items-center justify-between pt-2">
        <label className="text-sm font-semibold">
          Number of Positions Available
        </label>

        <div className="flex gap-3 items-center">
          <input
            type="number"
            min={1}
            className={
              "border border-black rounded-md px-3 py-2 w-20 text-center " +
              "focus:outline-none focus:border-black focus:ring-1 focus:ring-black " +
              "!focus:border-black !focus:ring-black"
            }
            value={positionsAvailable}
            onChange={(e) => setPositionsAvailable(Number(e.target.value))}
          />

          <button
            type="submit"
            className="rounded-md bg-green-600 text-white px-5 py-2 
                       hover:bg-green-700 transition"
          >
            Post
          </button>
        </div>
      </div>
    </form>
  );
}
