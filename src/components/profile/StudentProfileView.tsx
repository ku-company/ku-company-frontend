"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyStudentProfile, type StudentProfile } from "@/api/studentprofile";
import ResumeManagerModal from "@/components/ResumeManagerModal";

function PillHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.04)]">
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

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyStudentProfile();
        // 🧪 Log the verification state right when profile loads
        console.log("✅ [StudentProfileView] my-profile data:", data);
        console.log("🔎 [StudentProfileView] verified flags →", {
          verified: data?.verified,
          verify_raw: (data as any)?.verify,
          verified_status_raw: (data as any)?.verified_status,
        });
        setProfile(data);
      } catch (e: any) {
        console.error("❌ Failed to load student profile:", e);
        setErr(e.message || "Failed to load student profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-8 text-gray-600">Loading student profile…</div>;
  if (err) return <div className="p-8 text-red-500">{err}</div>;
  if (!profile) return <div className="p-8 text-gray-500">No profile found.</div>;

  // `getMyStudentProfile` already normalizes to a real boolean
  const canEdit = profile.verified === true;
  console.log("profile.verified:", profile.verified);
  console.log("🟢 [StudentProfileView] computed canEdit:", canEdit);

  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.user_name ||
    "Student";

  const email = profile.email || "";

  return (
    <><main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4">
        {canEdit ? (
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-semibold">
            Verified ✓ You can edit your profile
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-semibold">
            Awaiting verification — editing disabled
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT: Profile card */}
        <aside className="relative rounded-2xl border bg-white p-6 shadow-sm">
          <CornerIcon title="Edit profile" disabled={!canEdit} />
          <div className="flex flex-col items-center">
            <div className={`relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-[${GREEN}]\/15`}>
              <Image
                src={profile.avatar_url || "/profile.png"}
                alt="Profile"
                fill
                className="object-cover" />
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
              href={email ? `mailto:${email}` : undefined} />
            {/* If backend provides birthday */}
            {/* <InfoRow icon={<span className="text-xs">🎂</span>} label="Birthday" value={profile.birthday} /> */}
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
            <p className="mt-3 text-sm leading-6 text-gray-700">
              {profile.bio && profile.bio.trim()
                ? profile.bio
                : "No summary yet."}
            </p>
          </div>

          {/* Work / Projects (placeholder until API fields exist) */}
          <div
            className="relative rounded-2xl border bg-white p-6 shadow-sm"
            style={{ borderColor: GREEN }}
          >
            <CornerIcon title="Edit work history" disabled={!canEdit} />
            <PillHeading>Work History</PillHeading>

            <div className="mt-4 text-sm">
              <p className="text-gray-600">No work history yet.</p>

              <div className="mt-3 flex items-center justify-between">
                <Link href="#" className="text-xs hover:underline" style={{ color: GREEN }}>
                  See More…
                </Link>

                {/* Upload resume button */}
                <button
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs ${canEdit ? "text-gray-700 hover:bg-gray-50" : "text-gray-300 cursor-not-allowed"}`}
                  title={canEdit ? "Upload Resume" : "Verification required"}
                  style={{ borderColor: GREEN }}
                  disabled={!canEdit}
                  onClick={() => canEdit && setResumeOpen(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 20h14a1 1 0 0 0 1-1v-6h-2v5H6v-5H4v6a1 1 0 0 0 1 1zm7-16 5 5h-3v4h-4v-4H7l5-5z" fill="currentColor" />
                  </svg>
                  <span style={{ color: GREEN, opacity: canEdit ? 1 : 0.5 }}>Upload Resume</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM: Four cards (placeholders until API provides structured data) */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {/* Education */}
        <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
          <CornerIcon title="Edit education" disabled={!canEdit} />
          <PillHeading>Education</PillHeading>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>No education data yet.</li>
          </ul>
        </div>

        {/* Skills */}
        <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
          <CornerIcon title="Edit skills" disabled={!canEdit} />
          <PillHeading>Skills</PillHeading>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>No skills added yet.</li>
          </ul>
        </div>

        {/* Licenses */}
        <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
          <CornerIcon title="Edit licenses" disabled={!canEdit} />
          <PillHeading>Licenses or Certifications</PillHeading>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>No licenses yet.</li>
          </ul>
        </div>

        {/* Languages */}
        <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
          <CornerIcon title="Edit languages" disabled={!canEdit} />
          <PillHeading>Languages</PillHeading>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>No language data yet.</li>
          </ul>
        </div>
      </div>
    </main>
    <ResumeManagerModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} brandColor={GREEN} /></>
  );
}
