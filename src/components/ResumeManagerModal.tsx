"use client";

import { useEffect, useRef, useState } from "react";
import {
  listResumes,
  uploadResume,
  deleteResume,
  deleteAllResumes,
  type ResumeItem,
  setMainResume,
  MAIN_RESUME_UPDATED_EVENT,
} from "@/api/resume";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  brandColor?: string;
};

type Slot = { file?: File; uploading: boolean; error?: string };

export default function ResumeManagerModal({
  isOpen,
  onClose,
  brandColor = "#5D9252",
}: Props) {
  const [existing, setExisting] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  // Main resume selection state: choose, then Save
  const [tempMainId, setTempMainId] = useState<number | null>(null);
  const [hasUnsavedMain, setHasUnsavedMain] = useState(false);
  const [savingMain, setSavingMain] = useState(false);
  const [slot, setSlot] = useState<Slot>({ uploading: false });

  const overlayRef = useRef<HTMLDivElement>(null);

  const refreshList = async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const list = await listResumes();
      console.log("📦 [ResumeModal] list:", list);
      setExisting(list);
      // Initialize temp main from current list
      const currentMain = list.find((r) => r.is_main);
      setTempMainId(currentMain ? currentMain.id : null);
      setHasUnsavedMain(false);
    } catch (e: any) {
      console.error("❌ listResumes failed:", e);
      setLoadErr(e.message || "Failed to load resumes");
      setExisting([]);
    } finally {
      setLoading(false);
    }
  };

  // refresh when opened
  useEffect(() => {
    if (isOpen) refreshList();
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const existingIsEmpty = !existing || existing.length === 0;

  async function handleUpload() {
    if (!slot.file) {
      setSlot((s) => ({ ...s, error: "Please choose a PDF first." }));
      return;
    }
    setSlot((s) => ({ ...s, uploading: true, error: undefined }));

    try {
      await uploadResume(slot.file);
      await refreshList();
      setSlot({ uploading: false });
    } catch (e: any) {
      setSlot((s) => ({ ...s, uploading: false, error: e.message || "Upload failed" }));
    }
  }

  async function handleDeleteSingle(id: number) {
    if (!confirm("Delete this resume?")) return;
    try {
      await deleteResume(id);
      await refreshList();
    } catch (e: any) {
      alert(e.message || "Failed to delete resume");
    }
  }

  async function handleDeleteAll() {
    if (!confirm("Delete ALL uploaded resumes?")) return;
    try {
      await deleteAllResumes();
      await refreshList();
    } catch (e: any) {
      alert(e.message || "Failed to delete all resumes");
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="resume-manager-title"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl outline outline-1 outline-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl px-5 py-4">
          <h2 id="resume-manager-title" className="text-lg font-semibold">
            Manage Resumes
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
              <h3 className="text-sm font-semibold text-gray-700">Uploaded resumes</h3>
              {!existingIsEmpty && (
                <button
                  onClick={handleDeleteAll}
                  className="text-xs text-red-600 hover:underline"
                  title="Delete all resumes"
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
                No resumes yet. Upload below.
              </div>
            ) : (
              <ul className="space-y-2">
                {existing.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs">
                        PDF
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {r.name ?? `Resume ${r.id}`}
                        </div>
                        <label className="mt-0.5 inline-flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={r.id === tempMainId}
                            onChange={() => {
                              if (r.id === tempMainId) return; // no-op; cannot unset to none
                              setTempMainId(r.id);
                              setHasUnsavedMain(true);
                            }}
                          />
                          <span>{r.id === tempMainId ? (hasUnsavedMain ? "Will be main (unsaved)" : "Main resume") : "Set as main"}</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Preview
                      </a>
                      <button
                        onClick={() => handleDeleteSingle(r.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Upload slot (single) */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Upload (PDF, ≤ 10MB)
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setSlot({ uploading: false, file: f, error: undefined });
                  }}
                  className="block w-full cursor-pointer rounded-lg border px-3 py-2 text-sm"
                />
                <button
                  onClick={handleUpload}
                  disabled={slot.uploading || !slot.file}
                  className="rounded-md px-3 py-2 text-sm text-white disabled:opacity-50"
                  style={{ backgroundColor: brandColor }}
                >
                  {slot.uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
              {slot.file && (
                <div className="text-xs text-gray-600">Selected: {slot.file.name}</div>
              )}
              {slot.error && (
                <div className="text-xs text-red-600">{slot.error}</div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 rounded-b-2xl bg-gray-50 px-5 py-3">
          {hasUnsavedMain && (
            <button
              onClick={async () => {
                if (tempMainId == null) return;
                setSavingMain(true);
                try {
                  await setMainResume(tempMainId);
                  // Update list in-place; keep order
                  setExisting((list) => list.map((it) => ({ ...it, is_main: it.id === tempMainId })));
                  setHasUnsavedMain(false);
                  // Emit event for profile to update its link
                  const chosen = existing.find((x) => x.id === tempMainId);
                  if (chosen && typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent(MAIN_RESUME_UPDATED_EVENT, { detail: { id: chosen.id, url: chosen.file_url } }));
                  }
                } catch (e: any) {
                  alert(e?.message || "Failed to set main resume");
                } finally {
                  setSavingMain(false);
                }
              }}
              disabled={savingMain}
              className="rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: brandColor }}
            >
              {savingMain ? "Saving…" : "Save"}
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
