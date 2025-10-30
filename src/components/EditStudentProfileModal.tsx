"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
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
  section?: "summary" | "contact" | "work" | "education" | "skills" | "languages";
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

// Structured types for richer editing in the modal
type WorkItem = {
  company: string;
  role: string;
  start: string; // YYYY-MM or YYYY-MM-DD
  end?: string;  // empty = present
  description?: string;
};

type SkillLevel = "Bad" | "Fair" | "Well";
type LanguageLevel = "Fair" | "Good" | "Fluent" | "Native";

type SkillEntry = { name: string; level: SkillLevel };
type LanguageEntry = { name: string; level: LanguageLevel };
type EducationEntry = {
  school: string;
  degree?: string;
  field?: string;
  start?: string; // YYYY-MM
  end?: string;   // YYYY-MM
  description?: string;
};

function parseJSONSafe<T>(raw: unknown): T | null {
  if (typeof raw !== "string") return null;
  try {
    const v = JSON.parse(raw);
    return v as T;
  } catch {
    return null;
  }
}

export default function EditStudentProfileModal({
  isOpen,
  onClose,
  initial,
  onSaved,
  brandColor = "#5B8F5B",
  section,
}: Props) {
  const [education, setEducation] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [summary, setSummary] = useState("");
  // Rich editors state
  const [skills, setSkills] = useState<string>(""); // keeps raw text for fallback display only
  const [languages, setLanguages] = useState<string>(""); // raw text fallback
  const [experience, setExperience] = useState<string>(""); // raw text fallback

  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [skillList, setSkillList] = useState<SkillEntry[]>([]);
  const [languageList, setLanguageList] = useState<LanguageEntry[]>([]);
  const [educationList, setEducationList] = useState<EducationEntry[]>([]);
  const [contactInfo, setContactInfo] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLTextAreaElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const contactRef = useRef<HTMLTextAreaElement>(null);

  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [contactExpanded, setContactExpanded] = useState(false);
  const [summaryOverflow, setSummaryOverflow] = useState(false);
  const [contactOverflow, setContactOverflow] = useState(false);

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
    // Raw strings for backward compatibility / preview
    const rawSkills = toCleanText(initial?.skills);
    const rawLanguages = toCleanText(initial?.languages);
    const rawExperience = toCleanText((initial as any)?.experience);

    setSkills(rawSkills);
    setLanguages(rawLanguages);
    setExperience(rawExperience);
    setContactInfo(toCleanText((initial as any)?.contactInfo));

    // Try to parse JSON for rich editors; if parsing fails, start with empty structures
    const parsedEdu = parseJSONSafe<EducationEntry[]>(toCleanText(initial?.education)) ?? [];
    const parsedWork = parseJSONSafe<WorkItem[]>(rawExperience) ?? [];
    const parsedSkills = parseJSONSafe<SkillEntry[] | Record<string, SkillLevel>>(rawSkills);
    const parsedLangs = parseJSONSafe<LanguageEntry[] | Record<string, LanguageLevel>>(rawLanguages);

    setEducationList(Array.isArray(parsedEdu) ? parsedEdu : []);
    setWorkItems(Array.isArray(parsedWork) ? parsedWork : []);

    if (Array.isArray(parsedSkills)) {
      setSkillList(parsedSkills);
    } else if (parsedSkills && typeof parsedSkills === "object") {
      setSkillList(Object.entries(parsedSkills).map(([name, level]) => ({ name, level: (level as SkillLevel) })));
    } else {
      setSkillList([]);
    }

    if (Array.isArray(parsedLangs)) {
      setLanguageList(parsedLangs);
    } else if (parsedLangs && typeof parsedLangs === "object") {
      setLanguageList(Object.entries(parsedLangs).map(([name, level]) => ({ name, level: (level as LanguageLevel) })));
    } else {
      setLanguageList([]);
    }

    setTimeout(() => firstFieldRef.current?.focus(), 0);
  }, [isOpen, initial]);

  const canSave = useMemo(
    () =>
      [
        summary,
        contactInfo,
        JSON.stringify(workItems),
        JSON.stringify(educationList),
        JSON.stringify(skillList),
        JSON.stringify(languageList),
      ].some((v) => (v ?? "").toString().trim().length > 0),
    [summary, contactInfo, workItems, educationList, skillList, languageList]
  );

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    // Backend expects strings. Convert rich data to JSON strings.
    // Important: when lists are emptied, send empty strings to clear on backend
    const skillsString = skillList.length ? JSON.stringify(skillList) : "";
    const languagesString = languageList.length ? JSON.stringify(languageList) : "";
    const experienceString = workItems.length ? JSON.stringify(workItems) : "";

    // Backend expects strings for these fields
    const educationString = educationList.length ? JSON.stringify(educationList) : "";

    let payload: StudentProfileEditPayload = {};
    switch (section) {
      case "summary":
        payload = { summary: summary.trim() || undefined };
        break;
      case "contact":
        payload = { contactInfo: contactInfo.trim() || undefined, birthDate: birthDate.trim() || undefined };
        break;
      case "work":
        payload = { experience: experienceString };
        break;
      case "education":
        payload = { education: educationString };
        break;
      case "skills":
        payload = { skills: skillsString };
        break;
      case "languages":
        payload = { languages: languagesString };
        break;
      default:
        payload = {
          education: educationString,
          birthDate: birthDate.trim() || undefined,
          summary: summary.trim() || undefined,
          skills: skillsString,
          experience: experienceString,
          contactInfo: contactInfo.trim() || undefined,
          languages: languagesString,
        };
    }

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
              <h2 className="text-lg font-semibold">
                {section === 'summary' && 'Edit Personal Summary'}
                {section === 'contact' && 'Edit Contact'}
                {section === 'work' && 'Edit Work History'}
                {section === 'education' && 'Edit Education'}
                {section === 'skills' && 'Edit Skills'}
                {section === 'languages' && 'Edit Languages'}
                {!section && 'Edit Student Profile'}
              </h2>
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
              {/* Personal Summary */}
              {(!section || section === 'summary') && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Personal Summary</label>
                <textarea
                  ref={(el) => { summaryRef.current = el as HTMLTextAreaElement; firstFieldRef.current = el as HTMLTextAreaElement; }}
                  className={`${summaryExpanded ? 'h-72' : 'h-40'} rounded-md border px-3 py-2 text-sm overflow-y-auto`}
                  placeholder="Write a short summary about yourself"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>
              )}

              {/* Contact */}
              {(!section || section === 'contact') && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Phone Number</label>
                <input  
                  className={`rounded-md border px-3 py-2 text-sm overflow-y-auto`}
                  placeholder="+66 ..."
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>
              )}

              {/* Work History timeline editor */}
              {(!section || section === 'work') && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Work History</label>
                <div className="space-y-3">
                  {workItems.map((w, idx) => (
                    <div key={idx} className="rounded-md border p-3 space-y-2">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <input
                          className="rounded-md border px-3 py-2 text-sm"
                          placeholder="Company / Organization"
                          value={w.company}
                          onChange={(e) => {
                            const v = e.target.value;
                            setWorkItems((items) => items.map((it, i) => i === idx ? { ...it, company: v } : it));
                          }}
                        />
                        <input
                          className="rounded-md border px-3 py-2 text-sm"
                          placeholder="Role / Title"
                          value={w.role}
                          onChange={(e) => {
                            const v = e.target.value;
                            setWorkItems((items) => items.map((it, i) => i === idx ? { ...it, role: v } : it));
                          }}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <input
                          type="month"
                          className="rounded-md border px-3 py-2 text-sm"
                          placeholder="Start (YYYY-MM)"
                          value={w.start}
                          onChange={(e) => {
                            const v = e.target.value;
                            setWorkItems((items) => items.map((it, i) => i === idx ? { ...it, start: v } : it));
                          }}
                        />
                        <input
                          type="month"
                          className="rounded-md border px-3 py-2 text-sm"
                          placeholder="End (YYYY-MM) or empty for Present"
                          value={w.end || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setWorkItems((items) => items.map((it, i) => i === idx ? { ...it, end: v || undefined } : it));
                          }}
                        />
                      </div>
                      <textarea
                        className="h-16 w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="Short description / achievements"
                        value={w.description || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setWorkItems((items) => items.map((it, i) => i === idx ? { ...it, description: v } : it));
                        }}
                      />
                      <div className="flex justify-end">
                        <button
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
                          onClick={() => setWorkItems((items) => items.filter((_, i) => i !== idx))}
                        >
                          <TrashIcon className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="rounded-full px-4 py-2 text-sm border hover:bg-gray-50"
                    onClick={() => setWorkItems((items) => [...items, { company: "", role: "", start: "", end: undefined, description: "" }])}
                  >
                    + Add Work Item
                  </button>
                </div>
              </div>
              )}

              {/* Education editor (structured) */}
              {(!section || section === 'education') && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Education</label>
                <div className="space-y-3">
                  {educationList.map((ed, idx) => (
                    <div key={idx} className="rounded-md border p-3 space-y-2">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <input
                          className="rounded-md border px-3 py-2 text-sm"
                          placeholder="School / University"
                          value={ed.school}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEducationList((list) => list.map((it, i) => i === idx ? { ...it, school: v } : it));
                          }}
                        />
                        <input
                          className="rounded-md border px-3 py-2 text-sm"
                          placeholder="Degree (e.g., B.Eng.)"
                          value={ed.degree || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEducationList((list) => list.map((it, i) => i === idx ? { ...it, degree: v } : it));
                          }}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <input
                          className="rounded-md border px-3 py-2 text-sm"
                          placeholder="Field of study (e.g., Computer Engineering)"
                          value={ed.field || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEducationList((list) => list.map((it, i) => i === idx ? { ...it, field: v } : it));
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="month"
                            className="rounded-md border px-3 py-2 text-sm"
                            placeholder="Start"
                            value={ed.start || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setEducationList((list) => list.map((it, i) => i === idx ? { ...it, start: v } : it));
                            }}
                          />
                          <input
                            type="month"
                            className="rounded-md border px-3 py-2 text-sm"
                            placeholder="End or empty for Present"
                            value={ed.end || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setEducationList((list) => list.map((it, i) => i === idx ? { ...it, end: v || undefined } : it));
                            }}
                          />
                        </div>
                      </div>
                      <textarea
                        className="h-16 w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="Description / highlights"
                        value={ed.description || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEducationList((list) => list.map((it, i) => i === idx ? { ...it, description: v } : it));
                        }}
                      />
                      <div className="flex justify-end">
                        <button
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
                          onClick={() => setEducationList((list) => list.filter((_, i) => i !== idx))}
                        >
                          <TrashIcon className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="rounded-full px-4 py-2 text-sm border hover:bg-gray-50"
                    onClick={() => setEducationList((list) => [...list, { school: "", degree: "", field: "", start: "", end: "", description: "" }])}
                  >
                    + Add Education
                  </button>
                </div>
              </div>
              )}

              {/* Skills editor (structured) */}
              {(!section || section === 'skills') && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Skills</label>
                <div className="space-y-2">
                  {skillList.map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        className="flex-1 rounded-md border px-3 py-2 text-sm"
                        placeholder="Skill (e.g., React)"
                        value={s.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSkillList((list) => list.map((it, i) => i === idx ? { ...it, name: v } : it));
                        }}
                      />
                      <select
                        className="rounded-md border px-2 py-2 text-sm"
                        value={s.level}
                        onChange={(e) => {
                          const v = e.target.value as SkillLevel;
                          setSkillList((list) => list.map((it, i) => i === idx ? { ...it, level: v } : it));
                        }}
                      >
                        <option>Bad</option>
                        <option>Fair</option>
                        <option>Well</option>
                      </select>
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                        onClick={() => setSkillList((list) => list.filter((_, i) => i !== idx))}
                      >
                        <TrashIcon className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button
                      className="rounded-full px-4 py-2 text-sm border hover:bg-gray-50"
                      onClick={() => setSkillList((list) => [...list, { name: "", level: "Fair" }])}
                    >
                      + Add Skill
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* Languages editor (structured) */}
              {(!section || section === 'languages') && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Languages</label>
                <div className="space-y-2">
                  {languageList.map((l, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        className="flex-1 rounded-md border px-3 py-2 text-sm"
                        placeholder="Language (e.g., English)"
                        value={l.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setLanguageList((list) => list.map((it, i) => i === idx ? { ...it, name: v } : it));
                        }}
                      />
                      <select
                        className="rounded-md border px-2 py-2 text-sm"
                        value={l.level}
                        onChange={(e) => {
                          const v = e.target.value as LanguageLevel;
                          setLanguageList((list) => list.map((it, i) => i === idx ? { ...it, level: v } : it));
                        }}
                      >
                        <option>Fair</option>
                        <option>Good</option>
                        <option>Fluent</option>
                        <option>Native</option>
                      </select>
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                        onClick={() => setLanguageList((list) => list.filter((_, i) => i !== idx))}
                      >
                        <TrashIcon className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button
                      className="rounded-full px-4 py-2 text-sm border hover:bg-gray-50"
                      onClick={() => setLanguageList((list) => [...list, { name: "", level: "Fair" }])}
                    >
                      + Add Language
                    </button>
                  </div>
                </div>
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
