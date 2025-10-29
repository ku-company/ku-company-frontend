"use client";

import { useEffect, useState } from "react";
import { getMyProfessorProfile, type ProfessorProfile } from "@/api/professorprofile";
import { listProfessorDegrees, type ProfessorDegree } from "@/api/professordegrees";
import EditProfessorProfileModal from "@/components/EditProfessorProfileModal";
import MarkdownModal from "@/components/MarkdownModal";
import ProfileImageUploader from "@/components/ProfileImageUploader";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";

function PillHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  const display = (value ?? "").trim() ? value : "-";
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-700">{icon}</span>
      <div className="text-sm">
        <div className="text-gray-500">{label}</div>
        <div className="font-medium text-gray-800">{display}</div>
      </div>
    </div>
  );
}

export default function ProfessorProfileView() {
  const GREEN = "#4F7E4F";
  const { isReady, user } = useAuth();

  const [profile, setProfile] = useState<ProfessorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [degrees, setDegrees] = useState<ProfessorDegree[]>([]);
  const [degLoading, setDegLoading] = useState(false);
  const [modal, setModal] = useState<null | { title: string; content?: string; children?: React.ReactNode }>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      setLoading(false);
      setError("Please log in to view your profile.");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const data = await getMyProfessorProfile(controller.signal);
        if (!cancelled) {
          setProfile(data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled && err?.name !== "AbortError") {
          setError(err.message || "Error loading profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isReady, user]);

  // Load degrees once logged-in
  useEffect(() => {
    if (!isReady || !user) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        setDegLoading(true);
        const list = await listProfessorDegrees(controller.signal);
        if (!cancelled) setDegrees(list || []);
      } catch (e) {
        // non-fatal — show empty list
        if (!cancelled) setDegrees([]);
      } finally {
        if (!cancelled) setDegLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isReady, user]);

  if (!isReady) return <div className="p-8 text-gray-600">Preparing your session…</div>;
  if (loading) return <div className="p-8 text-gray-600">Loading professor profile…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!profile) return <div className="p-8 text-gray-500">No profile found. Please create or edit your profile.</div>;

  const fullName = [profile.user?.first_name ?? "", profile.user?.last_name ?? ""].map((s) => (s || "").trim()).filter(Boolean).join(" ") || user?.user_name || "";
  const isVerified = Boolean(profile.user?.verified);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => isVerified && setOpenEdit(true)}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          style={{ borderColor: GREEN }}
          disabled={!isVerified}
          title={isVerified ? "Edit your profile" : "Account not verified"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80"><path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/></svg>
          <span style={{ color: GREEN }}>Edit</span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left card */}
        <aside className="relative rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4" style={{ outline: `4px solid ${GREEN}22`, outlineOffset: 0 }}>
              <ProfileImageUploader kind="employee" initialUrl={profile.profile_image_url || null} onUpdated={() => { /* re-fetch not required for now */ }} />
            </div>
            <h2 className="mt-4 text-xl font-extrabold" style={{ color: GREEN }}>{fullName || "Professor"}</h2>
            <p className="text-sm text-gray-600">{profile.position || "-"}</p>
          </div>

          <div className="mt-6 space-y-4">
            <InfoRow icon={<span className="text-xs">🏫</span>} label="Department" value={profile.department} />
            <InfoRow icon={<span className="text-xs">🎓</span>} label="Faculty" value={profile.faculty} />
            <InfoRow icon={<span className="text-xs">☎️</span>} label="Contact Info" value={profile.contactInfo} />
          </div>
        </aside>

        {/* Summary */}
        <section className="space-y-6 md:col-span-2">
          <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
            <PillHeading>Summary</PillHeading>
            <div className="mt-3 prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{profile.summary || "_No summary yet._"}</ReactMarkdown>
            </div>
          </div>

          {/* Degrees (read-only here; manage inside Edit modal) */}
          <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
            <PillHeading>Degrees</PillHeading>
            <div className="mt-4 space-y-3">
              {degLoading && <div className="text-gray-500">Loading degrees…</div>}
              {!degLoading && degrees.length === 0 && (
                <div className="text-gray-500">No degrees added yet.</div>
              )}
              {!degLoading && degrees.slice(0, Math.min(2, degrees.length)).map((d) => (
                <div key={d.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-gray-500">{d.institution || "Institution"}</div>
                      <div className="text-base font-semibold text-gray-800">{d.title}</div>
                      <div className="text-xs text-gray-500">{d.graduation_date || ""}</div>
                    </div>
                    {/* edit via modal; no inline actions */}
                  </div>
                  {d.description && (
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{d.description}</div>
                  )}
                </div>
              ))}
            </div>
            {(!degLoading && degrees.length > 2) && (
              <div className="mt-3">
                <button
                  className="text-xs hover:underline"
                  style={{ color: GREEN }}
                  onClick={() =>
                    setModal({
                      title: 'Degrees',
                      children: (
                        <div className="space-y-3">
                          {degrees.map((d) => (
                            <div key={d.id} className="rounded-md border p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-sm text-gray-500">{d.institution || 'Institution'}</div>
                                  <div className="text-base font-semibold text-gray-800">{d.title}</div>
                                  <div className="text-xs text-gray-500">{d.graduation_date || ''}</div>
                                </div>
                              </div>
                              {d.description && (
                                <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{d.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ),
                    })
                  }
                >
                  See More...
                </button>
              </div>
            )}          </div>
        </section>
      </div>

      <EditProfessorProfileModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        initial={profile}
        initialDegrees={degrees}
        onDegreesSaved={(newList) => setDegrees(newList)}
        onSaved={(updated) => setProfile(updated)}
        brandColor={GREEN}
      />
    
      <MarkdownModal
        isOpen={!!modal}
        title={modal?.title || ''}
        content={modal?.content || ''}
        onClose={() => setModal(null)}
        brandColor={GREEN}
      >
        {modal?.children}
      </MarkdownModal>    </main>
  );
}

