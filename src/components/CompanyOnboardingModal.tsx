"use client";

import { useEffect, useRef, useState } from "react";
import { updateCompanyProfile } from "@/api/companyprofile";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CompanyOnboardingModal({ isOpen, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSaving(false);
      setTimeout(() => nameRef.current?.focus(), 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canSave = [companyName, country, description].every((v) => (v ?? "").trim().length > 0);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      // map country to `location` for backend shape
      await updateCompanyProfile({
        company_name: companyName,
        description,
        industry: "",
        tel: "",
        location: country,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to save company info");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      // Do not allow closing by clicking the backdrop; force completion
      onMouseDown={(e) => {
        // Intentionally do nothing to force onboarding
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold">Company Information</h2>
          {/* No close button to enforce completion */}
        </div>

        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Company Name</label>
            <input
              ref={nameRef}
              type="text"
              className="rounded-md border px-3 py-2 text-sm"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Country</label>
            <input
              type="text"
              className="rounded-md border px-3 py-2 text-sm"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="h-28 rounded-md border px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 rounded-b-2xl bg-gray-50 px-5 py-3">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-full bg-midgreen-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

