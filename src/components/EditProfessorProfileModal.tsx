"use client";

import { useEffect, useRef, useState } from "react";
import { patchProfessorProfile, type ProfessorProfile } from "@/api/professorprofile";
import type { ProfessorDegree } from "@/api/professordegrees";
import { createProfessorDegree, updateProfessorDegree, deleteProfessorDegree } from "@/api/professordegrees";

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
  initialDegrees?: ProfessorDegree[];
  onDegreesSaved?: (list: ProfessorDegree[]) => void;
};

type DegreeForm = {
  id?: number;
  title: string;
  institution?: string | null;
  graduation_date?: string | null;
  description?: string | null;
};

export default function EditProfessorProfileModal({ isOpen, onClose, initial, onSaved, brandColor = "#4F7E4F", initialDegrees = [], onDegreesSaved }: Props) {
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
  const [degrees, setDegrees] = useState<DegreeForm[]>([]);
  const initialDegreesRef = useRef<ProfessorDegree[]>(initialDegrees);

  useEffect(() => {
    if (isOpen) {
      setForm(makeDefaults(initial));
      setError(null);
      // seed degrees from parent list
      setDegrees((initialDegrees || []).map((d) => ({
        id: d.id,
        title: d.title,
        institution: d.institution ?? "",
        graduation_date: d.graduation_date ?? "",
        description: d.description ?? "",
      })));
      initialDegreesRef.current = initialDegrees || [];
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
  }, [isOpen, initial?.department, initial?.faculty, initial?.position, initial?.contactInfo, initial?.summary, initial?.user?.first_name, initial?.user?.last_name, initialDegrees]);

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
      const updates = {
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        department: form.department || null,
        faculty: form.faculty || null,
        position: form.position || null,
        contactInfo: form.contactInfo || null,
        summary: form.summary || null,
      };
      console.log("[EditProfessorProfileModal] Save clicked. Patching:", updates);
      const updated = await patchProfessorProfile(updates);

      // Degrees sync
      const before = initialDegreesRef.current || [];
      const after = degrees.filter((d) => (d.title || "").trim().length > 0);
      const beforeMap = new Map<number, ProfessorDegree>();
      for (const b of before) if (typeof b.id === "number") beforeMap.set(b.id, b);

      const toCreate = after.filter((d) => !d.id);
      const toUpdate = after.filter((d) => d.id && hasDegreeChanged(beforeMap.get(d.id!), d));
      const afterIds = new Set(after.map((d) => d.id).filter(Boolean) as number[]);
      const toDelete = before.filter((b) => b.id && !afterIds.has(b.id));

      const nextList: ProfessorDegree[] = [];
      // unchanged
      for (const d of after) {
        if (d.id && !toUpdate.some((u) => u.id === d.id)) {
          const original = beforeMap.get(d.id);
          if (original) nextList.push(original);
        }
      }
      for (const c of toCreate) {
        const created = await createProfessorDegree({
          title: c.title.trim(),
          institution: (c.institution || "").trim() || null,
          graduation_date: (c.graduation_date || "").trim() || null,
          description: (c.description || "").trim() || null,
        });
        nextList.push(created);
      }
      for (const u of toUpdate) {
        const upd = await updateProfessorDegree(u.id!, {
          title: u.title.trim(),
          institution: (u.institution || "").trim() || null,
          graduation_date: (u.graduation_date || "").trim() || null,
          description: (u.description || "").trim() || null,
        });
        nextList.push(upd);
      }
      for (const d of toDelete) {
        await deleteProfessorDegree(d.id!);
      }

      // De-dupe by id
      const seen = new Set<number>();
      const finalList = nextList.filter((x) => (x.id ? (seen.has(x.id) ? false : (seen.add(x.id), true)) : true));

      onSaved(updated);
      onDegreesSaved?.(finalList);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  function hasDegreeChanged(before?: ProfessorDegree, after?: DegreeForm): boolean {
    if (!before || !after) return false;
    return (
      (before.title || "") !== (after.title || "") ||
      (before.institution || "") !== ((after.institution as string) || "") ||
      (before.graduation_date || "") !== ((after.graduation_date as string) || "") ||
      (before.description || "") !== ((after.description as string) || "")
    );
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
          <div className="max-h-[85vh] overflow-y-auto rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b">
              <h2 className="text-lg font-semibold">Edit Professor Profile</h2>
              <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100" aria-label="Close">   </button>
            </div>

            <div className="space-y-4 px-5 py-5">
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

          {/* Degrees editor (structured) */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Degrees</label>
            <div className="space-y-3">
              {degrees.map((ed, idx) => (
                <div key={ed.id ?? `new-${idx}`} className="rounded-md border p-3 space-y-2">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      className="rounded-md border px-3 py-2 text-sm"
                      placeholder="Title (e.g., PhD in AI)"
                      value={ed.title}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDegrees((list) => list.map((it, i) => (i === idx ? { ...it, title: v } : it)));
                      }}
                    />
                    <input
                      className="rounded-md border px-3 py-2 text-sm"
                      placeholder="Institution"
                      value={ed.institution || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDegrees((list) => list.map((it, i) => (i === idx ? { ...it, institution: v } : it)));
                      }}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      type="date"
                      className="rounded-md border px-3 py-2 text-sm"
                      placeholder="Graduation Date"
                      value={ed.graduation_date || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDegrees((list) => list.map((it, i) => (i === idx ? { ...it, graduation_date: v } : it)));
                      }}
                    />
                  </div>
                  <textarea
                    className="h-16 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Description / thesis"
                    value={ed.description || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDegrees((list) => list.map((it, i) => (i === idx ? { ...it, description: v } : it)));
                    }}
                  />
                  <div className="flex justify-end">
                    <button
                      className="rounded-full px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700"
                      onClick={() => setDegrees((list) => list.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="rounded-full px-4 py-2 text-sm border hover:bg-gray-50"
                onClick={() => setDegrees((list) => [...list, { title: "", institution: "", graduation_date: "", description: "" }])}
              >
                + Add Degree
              </button>
            </div>
          </div>

              {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            </div>

            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 bg-gray-50 px-5 py-3 border-t rounded-b-2xl">
              <button onClick={onClose} className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100" disabled={saving}>Cancel</button>
              <button onClick={handleSave} disabled={!canSave || saving} className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: brandColor }}>{saving ? "Saving   " : "Save changes"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

