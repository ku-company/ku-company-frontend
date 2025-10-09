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
  onSubmit: (payload: { mode: "existing" | "upload"; resumeId?: string; file?: File }) => void;
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
  const [mode, setMode] = useState<"existing" | "upload">("existing");
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [file, setFile] = useState<File | undefined>(undefined);

  const overlayRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setMode("existing");
      setSelectedResumeId(resumes[0]?.id);
      setFile(undefined);
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

  const canSubmit = useMemo(() => {
    if (mode === "existing") return !!selectedResumeId;
    return !!file;
  }, [mode, selectedResumeId, file]);

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

        {/* Tabs */}
        <div className="px-5">
          <div className="mb-4 inline-flex rounded-full border p-1">
            <button
              ref={initialFocusRef}
              onClick={() => setMode("existing")}
              className={`rounded-full px-4 py-1 text-sm font-medium ${
                mode === "existing" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Use uploaded résumé
            </button>
            <button
              onClick={() => setMode("upload")}
              className={`rounded-full px-4 py-1 text-sm font-medium ${
                mode === "upload" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Upload new
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {mode === "existing" ? (
            <ul className="space-y-3">
              {resumes.length === 0 && (
                <li className="rounded-lg border border-dashed p-4 text-sm text-gray-600">
                  No uploaded résumés yet. Switch to <b>Upload new</b> to add one.
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
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium">Upload a PDF or DOCX</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0])}
                className="block w-full cursor-pointer rounded-lg border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-white hover:file:bg-gray-800"
              />
              {file && (
                <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                  Selected: <b>{file.name}</b> ({Math.round(file.size / 1024)} KB)
                </div>
              )}
            </div>
          )}
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
            onClick={() => onSubmit({ mode, resumeId: selectedResumeId, file })}
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
