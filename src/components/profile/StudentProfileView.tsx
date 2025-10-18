"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getMyStudentProfile,
  type StudentProfile,
} from "@/api/studentprofile";
import ResumeManagerModal from "@/components/ResumeManagerModal";
import EditStudentProfileModal from "@/components/EditStudentProfileModal";
import Markdown from "@/components/Markdown";
import MarkdownModal from "@/components/MarkdownModal";

function PillHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="self-start inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

function CornerIcon({ title, disabled = false }: { title: string; disabled?: boolean }) {
  return (
    <span
      title={disabled ? "Editing disabled until verified" : title}
      className={`absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg border bg-white ${
        disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50"
      }`}
      aria-disabled={disabled}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor" />
      </svg>
    </span>
  );
}

function toCleanText(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.filter(Boolean).map(String).join("\n");
  if (typeof v === "string") return v;
  try { return String(v); } catch { return ""; }
}

function InfoRow({
  icon, label, value, href,
}: {
  icon: React.ReactNode; label: string; value?: string; href?: string;
}) {
  const display = value && String(value).trim() ? value : "—";
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-700">
        {icon}
      </span>
      <div className="text-sm">
        <div className="text-gray-500">{label}</div>
        {href && display !== "—" ? (
          <a href={href} className="font-medium text-gray-800 hover:underline">
            {display}
          </a>
        ) : (
          <div className="font-medium text-gray-800">{display}</div>
        )}
      </div>
    </div>
  );
}

export default function StudentProfileView() {
  const GREEN = "#5b8f5b";

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [resumeOpen, setResumeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);


  useEffect(() => {
    (async () => {
      try {
        const data = await getMyStudentProfile();
        setProfile(data);
      } catch (e: any) {
        setErr(e.message || "Failed to load student profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // No height syncing logic; we'll use a fixed responsive min-height on Work History

  // Derived display fields (safe when profile is null)
  const email = profile?.email || "";
  const birthday = (() => {
    const b = profile?.birthday || "";
    const t = b.indexOf("T");
    return t > 0 ? b.slice(0, t) : b;
  })();
  const education = profile?.education || "";
  const skills = profile?.skills || "";
  const licenses = profile?.licenses || "";
  const languages = profile?.languages || "";
  const experience = profile?.experience || "";
  const contactInfo = toCleanText((profile as any)?.contactInfo);

  // Work History overflow handling + modal
  const [workMaxH, setWorkMaxH] = useState<number | undefined>(undefined);
  const [workOverflow, setWorkOverflow] = useState(false);
  const [modal, setModal] = useState<null | { title: string; content: string }>(null);

  // Desktop breakpoint flag (md)
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null;
    const update = () => setIsMd(!!mq?.matches);
    update();
    mq?.addEventListener?.('change', update as any);
    return () => mq?.removeEventListener?.('change', update as any);
  }, []);

  // Refs for measuring heights
  const [workCardEl, setWorkCardEl] = useState<HTMLDivElement | null>(null);
  const [workContentEl, setWorkContentEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    function recompute() {
      const card = workCardEl;
      const content = workContentEl;
      if (!card || !content) return;

      // clear previous constraint to measure natural sizes
      content.style.maxHeight = '';
      content.style.overflow = '';

      const fs = parseFloat(getComputedStyle(card).fontSize || '16');
      const target = fs * 19.5; // md:min-h-[19.5em]
      const cardH = card.getBoundingClientRect().height;
      const contentH = content.scrollHeight;

      if (cardH > target + 1) {
        const delta = cardH - target;
        const newMax = Math.max(0, contentH - delta);
        setWorkMaxH(newMax);
        setWorkOverflow(newMax < contentH - 1);
      } else {
        setWorkMaxH(undefined);
        setWorkOverflow(false);
      }
    }

    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [workCardEl, workContentEl, experience]);

  // Summary clamp + overflow detect
  const [summaryContentEl, setSummaryContentEl] = useState<HTMLDivElement | null>(null);
  const [summaryOverflow, setSummaryOverflow] = useState(false);
  useEffect(() => {
    const el = summaryContentEl;
    if (!el || !isMd) { setSummaryOverflow(false); return; }
    const check = () => setSummaryOverflow(el.scrollHeight > el.clientHeight + 1);
    check();
    const onResize = () => check();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [summaryContentEl, profile?.bio, isMd]);

  // Bottom cards overflow detection (Education, Skills, Licenses, Languages)
  const [eduEl, setEduEl] = useState<HTMLDivElement | null>(null);
  const [eduOverflow, setEduOverflow] = useState(false);
  const [skillsEl, setSkillsEl] = useState<HTMLDivElement | null>(null);
  const [skillsOverflow, setSkillsOverflow] = useState(false);
  const [licEl, setLicEl] = useState<HTMLDivElement | null>(null);
  const [licOverflow, setLicOverflow] = useState(false);
  const [langEl, setLangEl] = useState<HTMLDivElement | null>(null);
  const [langOverflow, setLangOverflow] = useState(false);

  useEffect(() => {
    const pairs: [HTMLElement | null, (v: boolean) => void][] = [
      [eduEl, setEduOverflow],
      [skillsEl, setSkillsOverflow],
      [licEl, setLicOverflow],
      [langEl, setLangOverflow],
    ];
    const check = () => {
      if (!isMd) { pairs.forEach(([, set]) => set(false)); return; }
      pairs.forEach(([el, set]) => {
        if (!el) { set(false); return; }
        set(el.scrollHeight > el.clientHeight + 1);
      });
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [eduEl, skillsEl, licEl, langEl, education, skills, licenses, languages, isMd]);

  if (loading) return <div className="p-8 text-gray-600">Loading student profile…</div>;
  if (err) return <div className="p-8 text-red-500">{err}</div>;
  if (!profile) return <div className="p-8 text-gray-500">No profile found.</div>;

  const canEdit = profile.verified === true;

  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.user_name ||
    "Student";

  

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Top-right global Edit button */}
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => canEdit && setEditOpen(true)}
            disabled={!canEdit}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm ${
              canEdit ? "text-gray-700 hover:bg-gray-50" : "text-gray-300 cursor-not-allowed"
            }`}
            style={{ borderColor: GREEN }}
            title={canEdit ? "Edit student profile" : "Awaiting verification"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <path
                d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                fill="currentColor"
              />
            </svg>
            <span style={{ color: GREEN, opacity: canEdit ? 1 : 0.5 }}>Edit</span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* LEFT: Profile card */}
          <aside className="relative self-start rounded-2xl border bg-white p-6 shadow-sm">
            <CornerIcon title="Edit profile" disabled={!canEdit} />
            <div className="flex flex-col items-center">
              <div className={`relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-[${GREEN}]\/15`}>
                <Image
                  src={profile.avatar_url || "/profile.png"}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>

              <h2 className="mt-4 text-xl font-extrabold" style={{ color: GREEN }}>
                {fullName}
              </h2>
              <p className="text-sm text-gray-600">Student</p>
            </div>

            <div className="mt-6 space-y-4">
              <InfoRow icon={<span className="text-xs">👤</span>} label="Username" value={profile.user_name} />
              <InfoRow
                icon={<span className="text-xs">✉️</span>}
                label="Mail"
                value={email}
                href={email ? `mailto:${email}` : undefined}
              />
              {birthday ? (
                <InfoRow icon={<span className="text-xs">🎂</span>} label="Birthday" value={birthday} />
              ) : null}
              {contactInfo ? (
                <InfoRow icon={<span className="text-xs">📞</span>} label="Contact" value={contactInfo} />
              ) : null}
            </div>
          </aside>

          {/* RIGHT: Summary + Work history */}
          <section className="md:col-span-2 space-y-6">
            {/* Personal Summary */}
            <div
              className="relative rounded-2xl border bg-white p-6 shadow-sm"
              style={{ borderColor: GREEN }}
            >
              <CornerIcon title="Edit summary" disabled={!canEdit} />
              <PillHeading>Personal Summary</PillHeading>
              {profile.bio && profile.bio.trim() ? (
                <div
                  ref={el => setSummaryContentEl(el)}
                  className="mt-3 text-sm leading-6 text-gray-700"
                  style={isMd ? { maxHeight: '12em', overflow: 'hidden' } : undefined}
                >
                  <Markdown content={profile.bio} />
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-gray-700">No summary yet.</p>
              )}
              {summaryOverflow && (
                <div className="mt-3">
                  <button
                    className="text-xs hover:underline"
                    style={{ color: GREEN }}
                    onClick={() => setModal({ title: 'Personal Summary', content: profile.bio || '' })}
                  >
                    See More…
                  </button>
                </div>
              )}
            </div>

            {/* Work / Projects (placeholder) */}
            <div
              ref={(el) => setWorkCardEl(el)}
              className="relative rounded-2xl border bg-white p-6 shadow-sm flex flex-col md:min-h-[19.5em]"
              style={{ borderColor: GREEN }}
            >
              <CornerIcon title="Edit work history" disabled={!canEdit} />
              <PillHeading>Work History</PillHeading>

              <div
                ref={(el) => setWorkContentEl(el)}
                className="mt-4 text-sm flex-1"
                style={workMaxH ? { maxHeight: workMaxH, overflow: 'hidden' } as any : undefined}
              >
                {experience && experience.trim() ? (
                  <Markdown content={experience} className="text-gray-800" />
                ) : (
                  <p className="text-gray-600">No work history yet.</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                {workOverflow ? (
                  <button
                    className="text-xs hover:underline"
                    style={{ color: GREEN }}
                    onClick={() => setModal({ title: 'Work History', content: experience })}
                  >
                    See More…
                  </button>
                ) : <span />}

                {/* Upload resume button */}
                <button
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs ${
                    canEdit ? "text-gray-700 hover:bg-gray-50" : "text-gray-300 cursor-not-allowed"
                  }`}
                  title={canEdit ? "Upload Resume" : "Verification required"}
                  style={{ borderColor: GREEN }}
                  disabled={!canEdit}
                  onClick={() => canEdit && setResumeOpen(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 20h14a1 1 0 0 0 1-1v-6h-2v5H6v-5H4v6a1 1 0 0 0 1 1zm7-16 5 5h-3v4h-4v-4H7l5-5z"
                      fill="currentColor"
                    />
                  </svg>
                  <span style={{ color: GREEN, opacity: canEdit ? 1 : 0.5 }}>Upload Resume</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* BOTTOM: Four cards (placeholders) */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
            <CornerIcon title="Edit education" disabled={!canEdit} />
            <PillHeading>Education</PillHeading>
            {education && education.trim() ? (
              <div ref={el => setEduEl(el)} className="mt-3 text-sm text-gray-800" style={isMd ? { maxHeight: '12em', overflow: 'hidden' } : undefined}>
                <Markdown content={education} />
              </div>
            ) : (
              <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>No education data yet.</li>
              </ul>
            )}
            {eduOverflow && (
              <div className="mt-3">
                <button className="text-xs hover:underline" style={{ color: GREEN }} onClick={() => setModal({ title: 'Education', content: education })}>
                  See More…
                </button>
              </div>
            )}
          </div>

          <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
            <CornerIcon title="Edit skills" disabled={!canEdit} />
            <PillHeading>Skills</PillHeading>
            {skills && skills.trim() ? (
              <div ref={el => setSkillsEl(el)} className="mt-3 text-sm text-gray-800" style={isMd ? { maxHeight: '12em', overflow: 'hidden' } : undefined}>
                <Markdown content={skills} />
              </div>
            ) : (
              <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>No skills added yet.</li>
              </ul>
            )}
            {skillsOverflow && (
              <div className="mt-3">
                <button className="text-xs hover:underline" style={{ color: GREEN }} onClick={() => setModal({ title: 'Skills', content: skills })}>
                  See More…
                </button>
              </div>
            )}
          </div>

          <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
            <CornerIcon title="Edit licenses" disabled={!canEdit} />
            <PillHeading>Licenses or Certifications</PillHeading>
            {licenses && licenses.trim() ? (
              <div ref={el => setLicEl(el)} className="mt-3 text-sm text-gray-800" style={isMd ? { maxHeight: '12em', overflow: 'hidden' } : undefined}>
                <Markdown content={licenses} />
              </div>
            ) : (
              <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>No licenses yet.</li>
              </ul>
            )}
            {licOverflow && (
              <div className="mt-3">
                <button className="text-xs hover:underline" style={{ color: GREEN }} onClick={() => setModal({ title: 'Licenses or Certifications', content: licenses })}>
                  See More…
                </button>
              </div>
            )}
          </div>

          <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
            <CornerIcon title="Edit languages" disabled={!canEdit} />
            <PillHeading>Languages</PillHeading>
            {languages && languages.trim() ? (
              <div ref={el => setLangEl(el)} className="mt-3 text-sm text-gray-800" style={isMd ? { maxHeight: '12em', overflow: 'hidden' } : undefined}>
                <Markdown content={languages} />
              </div>
            ) : (
              <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>No language data yet.</li>
              </ul>
            )}
            {langOverflow && (
              <div className="mt-3">
                <button className="text-xs hover:underline" style={{ color: GREEN }} onClick={() => setModal({ title: 'Languages', content: languages })}>
                  See More…
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ResumeManagerModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} brandColor={GREEN} />
      <EditStudentProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        initial={profile}
        onSaved={(updated) => setProfile(updated)}
        brandColor={GREEN}
      />
      <MarkdownModal
        isOpen={!!modal}
        title={modal?.title || ''}
        content={modal?.content || ''}
        onClose={() => setModal(null)}
        brandColor={GREEN}
      />
    </>
  );
}
