"use client";

import React, { useEffect, useRef, useState } from "react";

export type EditableJob = {
  title: string;
  position: string;
  details: string;
  positionsAvailable: number;
};

type EditJobModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initial: EditableJob | null;
  onSave: (updated: EditableJob) => void;
  brandColor?: string; // default midgreen
};

export default function EditJobModal({
  isOpen,
  onClose,
  initial,
  onSave,
  brandColor = "#5D9252",
}: EditJobModalProps) {
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState("");
  const [details, setDetails] = useState("");
  const [positionsAvailable, setPositionsAvailable] = useState<number | "">("");

  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initial) {
      setTitle(initial.title);
      setPosition(initial.position);
      setDetails(initial.details);
      setPositionsAvailable(initial.positionsAvailable);
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
  }, [isOpen, initial]);

  if (!isOpen || !initial) return null;

  const canSave = Boolean(title && position && details && positionsAvailable);

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
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold">Edit Job Posting</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 pb-5">
          <div className="flex items-center gap-3">
            <select
              value={position}
              onChange={(e) => {
                const v = e.target.value;
                setPosition(v);
                if (v && !title) setTitle(v);
              }}
              className="w-48 rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Choose Position</option>
              <option value="Machine Learning Engineer">Machine Learning Engineer</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
            </select>
            <input
              ref={firstFieldRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Job title"
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="h-32 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="More details…"
          />

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Number of Positions Available
            </label>
            <input
              type="number"
              min={1}
              className="w-24 rounded-md border px-3 py-2 text-sm"
              value={positionsAvailable}
              onChange={(e) =>
                setPositionsAvailable(e.target.value ? Number(e.target.value) : "")
              }
            />
          </div>
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
            disabled={!canSave}
            onClick={() =>
              canSave &&
              onSave({
                title,
                position,
                details,
                positionsAvailable: Number(positionsAvailable),
              })
            }
            className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: brandColor }}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
