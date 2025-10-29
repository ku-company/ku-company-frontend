"use client";

import { useEffect, useRef, useState } from "react";
import { createProfessorProfile } from "@/api/professorprofile";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  brandColor?: string;
};

export default function ProfessorOnboardingModal({ isOpen, onClose, onCreated, brandColor = "#4F7E4F" }: Props) {
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSaving(false);
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    } else {
      // Reset fields when closing
      setDepartment("");
      setFaculty("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canSave = String(department).trim().length > 0 && String(faculty).trim().length > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { department: department.trim(), faculty: faculty.trim() };
      console.log("[ProfessorOnboardingModal] Save clicked. Payload JSON:", JSON.stringify(payload));
      const created = await createProfessorProfile(payload);
      console.log("[ProfessorOnboardingModal] Created profile:", created);
      onCreated?.();
      onClose();
    } catch (e: any) {
      console.warn("[ProfessorOnboardingModal] Create failed:", e);
      setError(e?.message || "Failed to create profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold">Set Up Your Professor Profile</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          <p className="text-sm text-gray-600">Please provide your department and faculty to finish onboarding.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Department *</label>
              <input
                ref={firstFieldRef}
                type="text"
                className="rounded-md border px-3 py-2 text-sm"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Faculty *</label>
              <input
                type="text"
                className="rounded-md border px-3 py-2 text-sm"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 rounded-b-2xl bg-gray-50 px-5 py-3">
          <button onClick={onClose} className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: brandColor }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
