"use client";

import { useEffect, useRef, useState } from "react";
import { createProfessorProfile, type ProfessorCreatePayload } from "@/api/professorprofile";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  brandColor?: string;
};

export default function ProfessorOnboardingModal({ isOpen, onClose, onCreated, brandColor = "#4F7E4F" }: Props) {
  const [form, setForm] = useState<ProfessorCreatePayload>({ department: "", faculty: "", position: null, contactInfo: null, summary: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstRef.current?.focus(), 0);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canCreate = (form.department || "").trim().length > 0 && (form.faculty || "").trim().length > 0;

  const handleCreate = async () => {
    if (!canCreate || saving) return;
    setSaving(true);
    setError(null);
    try {
      await createProfessorProfile(form);
      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog" aria-modal="true"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="px-5 py-4 border-b"><h2 className="text-lg font-semibold">Complete Professor Profile</h2></div>
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-gray-600">Please provide department and faculty to create your profile.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Department *</label>
              <input ref={firstRef} type="text" className="rounded-md border px-3 py-2 text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Faculty *</label>
              <input type="text" className="rounded-md border px-3 py-2 text-sm" value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} />
            </div>
          </div>
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 rounded-b-2xl bg-gray-50 px-5 py-3">
          <button onClick={onClose} className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100" disabled={saving}>Later</button>
          <button onClick={handleCreate} disabled={!canCreate || saving} className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: brandColor }}>{saving ? "Creating…" : "Create profile"}</button>
        </div>
      </div>
    </div>
  );
}

