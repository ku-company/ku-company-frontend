"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  patchMyStudentProfile,
  type StudentProfile,
  type StudentProfileEditPayload,
} from "@/api/studentprofile";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: Partial<StudentProfile> | null;
  onSaved: (updated: StudentProfile) => void;
  brandColor?: string;
};

/** Accepts string | string[] | null | unknown and returns a nice text */
function toCleanText(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.filter(Boolean).map(String).join("\n");
  if (typeof v === "string") return v;
  // Fallback: stringify scalars/objects (rare)
  try {
    return String(v);
  } catch {
    return "";
  }
}

export default function EditStudentProfileModal({
  isOpen,
  onClose,
  initial,
  onSaved,
  brandColor = "#5B8F5B",
}: Props) {
  const [education, setEducation] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [languages, setLanguages] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    // Log what we got so you can verify the shape
    console.log("[EditStudentProfileModal] initial:", initial);

    // Your flattened StudentProfile maps backend fields to these props:
    // - education/skills/languages may be string[] OR string OR null
    // - birthday is a string (ISO or yyyy-mm-dd)
    // - bio is your “summary”
    setEducation(toCleanText(initial?.education));
    setBirthDate(initial?.birthday ?? "");
    setSummary(initial?.bio ?? "");
    setSkills(toCleanText(initial?.skills));
    // These two might not exist in your flattened profile yet; default to empty
    setExperience(toCleanText((initial as any)?.experience));
    setContactInfo(toCleanText((initial as any)?.contactInfo));
    setLanguages(toCleanText(initial?.languages));

    setTimeout(() => firstFieldRef.current?.focus(), 0);
  }, [isOpen, initial]);

  const canSave = useMemo(
    () =>
      [education, birthDate, summary, skills, experience, contactInfo, languages]
        .some((v) => (v ?? "").trim().length > 0),
    [education, birthDate, summary, skills, experience, contactInfo, languages]
  );

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    // Backend expects strings for these fields
    const payload: StudentProfileEditPayload = {
      education: education.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      summary: summary.trim() || undefined,
      skills: skills.trim() || undefined,
      experience: experience.trim() || undefined,
      contactInfo: contactInfo.trim() || undefined,
      languages: languages.trim() || undefined,
    };

    console.log("[EditStudentProfileModal] PATCH payload:", payload);

    try {
      const updated = await patchMyStudentProfile(payload);
      onSaved(updated);
      onClose();
    } catch (e: any) {
      console.error("PATCH my-profile/edit failed:", e);
      setError(e?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
          <div className="max-h-[85vh] overflow-y-auto rounded-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b">
              <h2 className="text-lg font-semibold">Edit Student Profile</h2>
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
              <div className="grid gap-2">
                <label className="text-sm font-medium">Education</label>
                <textarea
                  ref={firstFieldRef}
                  className="h-20 rounded-md border px-3 py-2 text-sm"
                  placeholder="Bachelor of Computer Engineering, Kasetsart University"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Birth date</label>
                  <input
                    type="date"
                    className="rounded-md border px-3 py-2 text-sm"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Personal Summary</label>
                <textarea
                  className="h-24 rounded-md border px-3 py-2 text-sm"
                  placeholder="Motivated software engineer with 3+ years of experience…"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Skills</label>
                <textarea
                  className="h-20 rounded-md border px-3 py-2 text-sm"
                  placeholder="Python, Django, React, TypeScript, PostgreSQL"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Experience</label>
                <textarea
                  className="h-24 rounded-md border px-3 py-2 text-sm"
                  placeholder="Software Developer at TechSoft Co. (2022–2024)…"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Contact Info</label>
                <textarea
                  className="h-16 rounded-md border px-3 py-2 text-sm"
                  placeholder="name@example.com | +66 ... | Bangkok, Thailand"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Languages</label>
                <textarea
                  className="h-16 rounded-md border px-3 py-2 text-sm"
                  placeholder="English, Thai"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 bg-gray-50 px-5 py-3 border-t">
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
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
