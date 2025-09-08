"use client";

import { useState } from "react";

export default function JobPostForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [position, setPosition] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [positionsAvailable, setPositionsAvailable] = useState<number | "">("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      position,
      title,
      details,
      positionsAvailable,
    });
    // Reset form
    setTitle("");
    setDetails("");
    setPositionsAvailable("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-midgreen rounded-md p-4 space-y-4 bg-white"
    >
      {/* Position selector */}
      <div className="flex items-center border rounded-md overflow-hidden">
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="px-3 py-2 border-r focus:outline-none"
        >
          <option value="">Choose Position</option>
          <option value="Machine Learning Engineer">Machine Learning Engineer</option>
          <option value="Software Engineer">Software Engineer</option>
          <option value="Data Scientist">Data Scientist</option>
        </select>
        <input
          type="text"
          placeholder="Machine Learning Engineer:"
          className="flex-1 px-3 py-2 focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          type="button"
          className="px-3 py-2 text-gray-500 hover:text-gray-700"
        >
          📎
        </button>
      </div>

      {/* Main info */}
      <input
        type="text"
        placeholder="Add main information"
        className="w-full rounded-md border px-3 py-2 focus:outline-none"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Details */}
      <textarea
        placeholder="More Details here......."
        className="w-full rounded-md border px-3 py-2 focus:outline-none h-28"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />

      {/* Number of positions + Post button */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-800">
          Number of Positions Available
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            className="w-20 rounded-md border px-3 py-1 focus:outline-none"
            value={positionsAvailable}
            onChange={(e) =>
              setPositionsAvailable(e.target.value ? Number(e.target.value) : "")
            }
          />
          <button
            type="submit"
            className="bg-midgreen text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition"
          >
            Post
          </button>
        </div>
      </div>
    </form>
  );
}
