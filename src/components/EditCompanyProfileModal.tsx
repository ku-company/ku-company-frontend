"use client";

import { useEffect, useRef, useState } from "react";
import { updateCompanyProfile, type CompanyProfile } from "@/api/companyprofile";

type CompanyProfileForm = {
  company_name: string;
  description: string;
  industry: string;
  tel: string;
  location: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: Partial<CompanyProfile> | null; // may be undefined/null while loading
  onSaved: (updated: CompanyProfile) => void;
  brandColor?: string;
};

export default function EditCompanyProfileModal({
  isOpen,
  onClose,
  initial,
  onSaved,
  brandColor = "#5D9252",
}: Props) {
  // always keep a safe form shape
  const makeDefaults = (src?: Partial<CompanyProfile> | null): CompanyProfileForm => ({
    company_name: src?.company_name ?? "",
    description: src?.description ?? "",
    industry: src?.industry ?? "",
    tel: src?.tel ?? "",
    location: src?.location ?? "",
  });

  const [form, setForm] = useState<CompanyProfileForm>(makeDefaults(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Reset form each time modal opens or initial changes
  useEffect(() => {
    if (isOpen) {
      setForm(makeDefaults(initial));
      setError(null);
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initial?.company_name, initial?.description, initial?.industry, initial?.tel, initial?.location]);

  if (!isOpen) return null;

  const onChange =
    (key: keyof CompanyProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value ?? "";
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  // safe canSave (no direct .trim() on possibly undefined)
  const canSave = ["company_name", "description", "industry", "tel", "location"]
    .map((k) => (form as any)[k] as string)
    .every((v) => (v ?? "").trim().length > 0);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCompanyProfile(form);
      onSaved(updated);
      onClose();
    } catch (err: any) {
      console.error("PATCH company profile failed:", err);
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
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold">Edit Company Profile</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
               
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-3">
            <label className="text-sm font-medium">Company Name</label>
            <input
              ref={firstFieldRef}
              type="text"
              className="rounded-md border px-3 py-2 text-sm"
              value={form.company_name}
              onChange={onChange("company_name")}
            />
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium">
            Description (supports **Markdown**)
            </label>
            <textarea
              className="h-28 rounded-md border px-3 py-2 text-sm"
              value={form.description}
              onChange={onChange("description")}
            />
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium">Industry</label>
            <input
              type="text"
              className="rounded-md border px-3 py-2 text-sm"
              value={form.industry}
              onChange={onChange("industry")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-3">
              <label className="text-sm font-medium">Telephone</label>
              <input
                type="text"
                className="rounded-md border px-3 py-2 text-sm"
                value={form.tel}
                onChange={onChange("tel")}
              />
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium">Location</label>
              <input
                type="text"
                className="rounded-md border px-3 py-2 text-sm"
                value={form.location}
                onChange={onChange("location")}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 rounded-b-2xl bg-gray-50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: brandColor }}
          >
            {saving ? "Saving   " : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
