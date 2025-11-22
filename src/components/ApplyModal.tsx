"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Resume = {
  id: string;
  name: string;
  updatedAt?: string; // e.g., "Updated 2 days ago"
  size?: string;      // e.g., "142 KB"
};

type ApplyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { mode: "existing"; resumeId?: string }) => void;
  resumes: Resume[];
  jobTitle?: string;
  brandColor?: string; // fallback to midgreen
};

export default function ApplyModal({
  isOpen,
  onClose,
  onSubmit,
  resumes,
  jobTitle,
  brandColor = "#5D9252",
}: ApplyModalProps) {
  const [mode] = useState<"existing">("existing");
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  // upload removed

  const overlayRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedResumeId(resumes[0]?.id);
      // small delay to allow mount then focus
      setTimeout(() => initialFocusRef.current?.focus(), 0);
    }
  }, [isOpen, resumes]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const canSubmit = useMemo(() => !!selectedResumeId, [selectedResumeId]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="apply-modal-title"
      onMouseDown={(e) => {
        // close when clicking backdrop (but not when dragging inside)
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl outline outline-1 outline-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl px-5 py-4">
          <h2 id="apply-modal-title" className="text-lg font-semibold">
            Apply to {jobTitle ?? "this job"}
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* No tabs: only existing resumes */}
        <div className="px-5">
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Choose your resume</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {
            <ul className="space-y-3">
              {resumes.length === 0 && (
                <li className="rounded-lg border border-dashed p-4 text-sm text-gray-600">
                  No uploaded resume yet. Please upload one from your profile.
                </li>
              )}
              {resumes.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                    selectedResumeId === r.id ? "ring-2 ring-offset-0" : ""
                  }`}
                  style={{
                    borderColor: "#e5e7eb",
                    boxShadow: selectedResumeId === r.id ? `0 0 0 2px ${brandColor}` : undefined,
                  }}
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="resume"
                      value={r.id}
                      checked={selectedResumeId === r.id}
                      onChange={() => setSelectedResumeId(r.id)}
                      className="h-4 w-4"
                    />
                    <div>
                      <div className="font-medium">{r.name}</div>
                      {(r.updatedAt || r.size) && (
                        <div className="text-xs text-gray-500">
                          {r.updatedAt ? r.updatedAt : ""} {r.updatedAt && r.size ? "•" : ""}{" "}
                          {r.size ? r.size : ""}
                        </div>
                      )}
                    </div>
                  </label>
                  <a href="#" className="text-xs font-medium text-gray-600 hover:underline">
                    Preview
                  </a>
                </li>
              ))}
            </ul>
          }
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 rounded-b-2xl bg-gray-50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => onSubmit({ mode, resumeId: selectedResumeId })}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50`}
            style={{ backgroundColor: brandColor }}
          >
            Submit application
          </button>
        </div>
      </div>
    </div>
  );
}
