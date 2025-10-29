"use client";

import React, { useEffect, useRef, useState } from "react";

export type EditableJob = {
  title: string;
  position: string;
  details: string;
  positionsAvailable: number;
  jobType?: string;
  // Backend-connected fields
  location?: string;
  minimum_expected_salary?: number;
  maximum_expected_salary?: number;
  expired_at?: string | null; // YYYY-MM-DD
  workType?: string; // Values: OnSite | Online | Hybrid
};

type EditJobModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initial: EditableJob | null;
  onSave: (updated: EditableJob) => void;
  brandColor?: string;
  mode?: "create" | "edit";
};

export default function EditJobModal({
  isOpen,
  onClose,
  initial,
  onSave,
  brandColor = "#5D9252",
  mode = "edit",
}: EditJobModalProps) {
  // === Local state ===
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState("");
  const [details, setDetails] = useState("");
  const [positionsAvailable, setPositionsAvailable] = useState<number | "">("");
  const [jobType, setJobType] = useState("");
  const [requirements, setRequirements] = useState("");
  const [location, setLocation] = useState("");
  const [expectedSalaryMin, setExpectedSalaryMin] = useState<string>("");
  const [expectedSalaryMax, setExpectedSalaryMax] = useState<string>("");
  const [workType, setWorkType] = useState<string>("");
  const [expiredAt, setExpiredAt] = useState<string>("");

  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // === Load data when modal opens ===
  useEffect(() => {
    if (!isOpen) return;
    const src = initial || (mode === "create" ? { title: "", position: "", details: "", positionsAvailable: 1 } as EditableJob : null);
    if (!src) return;
    setTitle(src.title ?? "");
    setPosition(src.position ?? "");
    setDetails(src.details ?? "");
    setPositionsAvailable(src.positionsAvailable ?? "");
    setJobType(src.jobType ?? (mode === "create" ? "Full Time" : ""));
    setLocation(src.location ?? "");
    setExpectedSalaryMin(
      src.minimum_expected_salary != null ? String(src.minimum_expected_salary) : ""
    );
    setExpectedSalaryMax(
      src.maximum_expected_salary != null ? String(src.maximum_expected_salary) : ""
    );
    setWorkType(src.workType ?? "");
    setExpiredAt(src.expired_at ? String(src.expired_at).slice(0,10) : "");
    setTimeout(() => firstFieldRef.current?.focus(), 0);
  }, [isOpen, initial, mode]);

  if (!isOpen || (!initial && mode !== "create")) return null;

  // === Validation ===
  const canSave = Boolean(
    title &&
    position &&
    details &&
    positionsAvailable &&
    jobType &&
    location &&
    workType &&
    expectedSalaryMin !== "" &&
    expectedSalaryMax !== "" &&
    Number(expectedSalaryMin) > 0 &&
    Number(expectedSalaryMax) > 0 &&
    Number(expectedSalaryMin) <= Number(expectedSalaryMax)
  );

  // === Prisma-compatible position enums ===
  const positionOptions = [
    { label: "Backend Developer", value: "Backend_Developer" },
    { label: "Frontend Developer", value: "Frontend_Developer" },
    { label: "Fullstack Developer", value: "Fullstack_Developer" },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[40em] rounded-2xl bg-white shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">{mode === 'create' ? 'Post a Job' : 'Edit Job Posting'}</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-5">
          {/* Position + Title */}
          <div className="flex items-center gap-3">
            <select
              value={position}
              onChange={(e) => {
                const v = e.target.value;
                setPosition(v);
              }}
              className="w-1/2 rounded-md border px-3 py-2 text-sm focus:ring-2"
              style={{ outlineColor: brandColor }}
            >
              <option value="">Choose Position</option>
              {positionOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <input
              ref={firstFieldRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Job title"
              className="flex-1 rounded-md border px-3 py-2 text-sm focus:ring-2"
              style={{ outlineColor: brandColor }}
            />
          </div>

          {/* Description */}
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="h-32 w-full rounded-md border px-3 py-2 text-sm focus:ring-2"
            style={{ outlineColor: brandColor }}
            placeholder="Enter job description…"
          />

          {/* Available positions */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Number of Positions Available
            </label>
            <input
              type="number"
              min={1}
              className="w-24 rounded-md border px-3 py-2 text-sm text-center focus:ring-2"
              style={{ outlineColor: brandColor }}
              value={positionsAvailable}
              onChange={(e) =>
                setPositionsAvailable(e.target.value ? Number(e.target.value) : "")
              }
            />
          </div>

          {/* Job Type */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-gray-700">Job Type</label>
            <select
              className="rounded-md border px-3 py-2 text-sm focus:ring-2"
              style={{ outlineColor: brandColor }}
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              <option value="">Select type</option>
              <option>Full Time</option>
              <option>Part Time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </div>

          {/* More fields (visual only until backend is ready) */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <input className="rounded-md border px-3 py-2 text-sm focus:ring-2" style={{ outlineColor: brandColor }} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City / Remote" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">Expected Salary (Min - Max)</label>
              <div className="flex items-center gap-2">
                <input className="w-32 rounded-md border px-3 py-2 text-sm focus:ring-2" style={{ outlineColor: brandColor }} value={expectedSalaryMin} onChange={(e) => setExpectedSalaryMin(e.target.value)} placeholder="18000" />
                <span>-</span>
                <input className="w-32 rounded-md border px-3 py-2 text-sm focus:ring-2" style={{ outlineColor: brandColor }} value={expectedSalaryMax} onChange={(e) => setExpectedSalaryMax(e.target.value)} placeholder="30000" />
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">Work Place</label>
              <select className="rounded-md border px-3 py-2 text-sm focus:ring-2" style={{ outlineColor: brandColor }} value={workType} onChange={(e) => setWorkType(e.target.value)}>
                <option value="">Select</option>
                <option value="OnSite">On-site</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">Expiration Date</label>
              <input type="date" className="rounded-md border px-3 py-2 text-sm focus:ring-2" style={{ outlineColor: brandColor }} value={expiredAt} onChange={(e) => setExpiredAt(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 rounded-b-2xl bg-gray-50 px-5 py-3 border-t">
          <button
            onClick={onClose}
            className="rounded-full border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            disabled={!canSave}
            onClick={() =>
              canSave &&
              onSave({
                title,
                position,
                details,
                positionsAvailable: Number(positionsAvailable),
                jobType,
                location,
                minimum_expected_salary: expectedSalaryMin ? Number(expectedSalaryMin) : undefined,
                maximum_expected_salary: expectedSalaryMax ? Number(expectedSalaryMax) : undefined,
                expired_at: expiredAt || null,
                workType,
              })
            }
            className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 transition"
            style={{ backgroundColor: brandColor }}
          >
            {mode === 'create' ? 'Create Job' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
