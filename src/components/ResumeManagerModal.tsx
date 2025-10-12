// src/components/resume/ResumeManagerModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deleteAllResumes, listResumes, uploadResume, type ResumeItem } from "@/api/resume";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  brandColor?: string;
};

type Slot = { file?: File; uploading: boolean; error?: string };

export default function ResumeManagerModal({ isOpen, onClose, brandColor = "#5D9252" }: Props) {
  const [existing, setExisting] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // 3 upload slots
  const [slots, setSlots] = useState<Slot[]>([
    { uploading: false },
    { uploading: false },
    { uploading: false },
  ]);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const list = await listResumes();
        console.log("📦 [ResumeModal] existing resumes:", list);
        setExisting(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.error("❌ listResumes failed:", e);
        setLoadErr(e.message || "Failed to load resumes");
        setExisting([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const existingIsEmpty = !existing || existing.length === 0;

  async function handleUpload(idx: number) {
    const slot = slots[idx];
    if (!slot.file) {
      setSlots((s) => {
        const copy = [...s];
        copy[idx].error = "Please choose a PDF first.";
        return copy;
      });
      return;
    }
    setSlots((s) => {
      const copy = [...s];
      copy[idx].uploading = true;
      copy[idx].error = undefined;
      return copy;
    });
    try {
      console.log("⬆️ Uploading slot", idx, slot.file.name, slot.file.size, slot.file.type);
      await uploadResume(slot.file);
      const list = await listResumes();
      setExisting(Array.isArray(list) ? list : []);
      setSlots((s) => {
        const copy = [...s];
        copy[idx] = { uploading: false, file: undefined, error: undefined };
        return copy;
      });
    } catch (e: any) {
      setSlots((s) => {
        const copy = [...s];
        copy[idx].uploading = false;
        copy[idx].error = e.message || "Upload failed";
        return copy;
      });
    }
  }

  async function handleDeleteAll() {
    if (!confirm("Delete ALL uploaded resumes?")) return;
    try {
      await deleteAllResumes();
      setExisting([]);
    } catch (e: any) {
      alert(e.message || "Failed to delete resumes");
    }
  }

  const canSave = useMemo(() => true, []);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="resume-manager-title"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl outline outline-1 outline-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl px-5 py-4">
          <h2 id="resume-manager-title" className="text-lg font-semibold">
            Manage Résumés
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

        <div className="px-5 pb-5 space-y-6">
          {/* Existing list */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Uploaded résumés</h3>
              {!existingIsEmpty && (
                <button
                  onClick={handleDeleteAll}
                  className="text-xs text-red-600 hover:underline"
                  title="Delete all résumés"
                >
                  Delete all
                </button>
              )}
            </div>

            {loading ? (
              <div className="rounded border p-3 text-sm text-gray-600">Loading…</div>
            ) : loadErr ? (
              <div className="rounded border p-3 text-sm text-red-600">{loadErr}</div>
            ) : existingIsEmpty ? (
              <div className="rounded border border-dashed p-3 text-sm text-gray-600">
                No résumés yet. Upload below.
              </div>
            ) : (
              <ul className="space-y-2">
                {existing.map((r) => (
                  <li
                    key={String(r.id)}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs">PDF</span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{r.name ?? `Resume ${r.id}`}</div>
                        {(r.updatedAt || r.size) && (
                          <div className="truncate text-xs text-gray-500">
                            {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""}
                            {r.updatedAt && r.size ? " • " : ""}
                            {typeof r.size === "number" ? `${Math.round(r.size / 1024)} KB` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Preview
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No preview</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Upload slots */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Upload (PDF, ≤ 10MB)</h3>
            <div className="space-y-3">
              {slots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setSlots((s) => {
                        const copy = [...s];
                        copy[idx].file = f;
                        copy[idx].error = undefined;
                        return copy;
                      });
                    }}
                    className="block w-full cursor-pointer rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => handleUpload(idx)}
                    disabled={slot.uploading || !slot.file}
                    className="rounded-md px-3 py-2 text-sm text-white disabled:opacity-50"
                    style={{ backgroundColor: brandColor }}
                  >
                    {slot.uploading ? "Uploading…" : "Upload"}
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-500">Only PDF files are accepted. Max size 10MB.</p>
              {slots.some(s => s.error) && (
                <div className="text-xs text-red-600">
                  {slots.map((s, i) => s.error ? <div key={i}>Slot {i+1}: {s.error}</div> : null)}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 rounded-b-2xl bg-gray-50 px-5 py-3">
          <button onClick={onClose} className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100">
            Close
          </button>
          <button
            disabled={!canSave}
            onClick={onClose}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: brandColor }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
