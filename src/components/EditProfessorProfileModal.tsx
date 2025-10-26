"use client";

import { useEffect, useRef, useState } from "react";
import { patchProfessorProfile, type ProfessorProfile } from "@/api/professorprofile";

type Form = {
  first_name: string;
  last_name: string;
  department: string;
  faculty: string;
  position: string;
  contactInfo: string;
  summary: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: ProfessorProfile | null;
  onSaved: (updated: ProfessorProfile) => void;
  brandColor?: string;
};

export default function EditProfessorProfileModal({ isOpen, onClose, initial, onSaved, brandColor = "#4F7E4F" }: Props) {
  const makeDefaults = (src?: ProfessorProfile | null): Form => ({
    first_name: src?.user?.first_name ?? "",
    last_name: src?.user?.last_name ?? "",
    department: src?.department ?? "",
    faculty: src?.faculty ?? "",
    position: src?.position ?? "",
    contactInfo: src?.contactInfo ?? "",
    summary: src?.summary ?? "",
  });

  const [form, setForm] = useState<Form>(makeDefaults(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(makeDefaults(initial));
      setError(null);
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
  }, [isOpen, initial?.department, initial?.faculty, initial?.position, initial?.contactInfo, initial?.summary, initial?.user?.first_name, initial?.user?.last_name]);

  if (!isOpen) return null;

  const onChange = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value ?? "";
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // first_name/last_name are required only if they don't exist on the user already
  const mustRequireFirst = !(initial?.user?.first_name && String(initial.user.first_name).trim());
  const mustRequireLast = !(initial?.user?.last_name && String(initial.user.last_name).trim());

  const canSave = [
    ...(mustRequireFirst ? [form.first_name] : ["ok"]),
    ...(mustRequireLast ? [form.last_name] : ["ok"]),
    form.department,
    form.faculty,
  ].every((v) => String(v ?? "").trim().length > 0);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await patchProfessorProfile({
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        department: form.department || null,
        faculty: form.faculty || null,
        position: form.position || null,
        contactInfo: form.contactInfo || null,
        summary: form.summary || null,
      });
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

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
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold">Edit Professor Profile</h2>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100" aria-label="Close">✕</button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">First Name {mustRequireFirst && <span className="text-red-500">*</span>}</label>
              <input ref={firstFieldRef} type="text" className="rounded-md border px-3 py-2 text-sm" value={form.first_name} onChange={onChange("first_name")} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Last Name {mustRequireLast && <span className="text-red-500">*</span>}</label>
              <input type="text" className="rounded-md border px-3 py-2 text-sm" value={form.last_name} onChange={onChange("last_name")} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Department *</label>
              <input type="text" className="rounded-md border px-3 py-2 text-sm" value={form.department} onChange={onChange("department")} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Faculty *</label>
              <input type="text" className="rounded-md border px-3 py-2 text-sm" value={form.faculty} onChange={onChange("faculty")} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Position</label>
              <input type="text" className="rounded-md border px-3 py-2 text-sm" value={form.position} onChange={onChange("position")} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Contact Info</label>
              <input type="text" className="rounded-md border px-3 py-2 text-sm" value={form.contactInfo} onChange={onChange("contactInfo")} />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Summary</label>
            <textarea className="h-28 rounded-md border px-3 py-2 text-sm" value={form.summary} onChange={onChange("summary")} />
          </div>

          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 rounded-b-2xl bg-gray-50 px-5 py-3">
          <button onClick={onClose} className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100" disabled={saving}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave || saving} className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: brandColor }}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

