"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getCompanyProfile, type CompanyProfile } from "@/api/companyprofile";
import EditCompanyProfileModal from "@/components/EditCompanyProfileModal";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";
import ProfileImageUploader from "@/components/ProfileImageUploader";
import { MapPinIcon, PhoneIcon, GlobeAltIcon, CheckBadgeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { getAuthMe } from "@/api/user";
import { refreshAccessToken } from "@/api/token";

function PillHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-700">
        {icon}
      </span>
      <div className="text-sm">
        <div className="text-gray-500">{label}</div>
        <div className="font-medium text-gray-800">{value}</div>
      </div>
    </div>
  );
}

export default function CompanyProfile() {
  const GREEN = "#5D9252";
  const { isReady, user } = useAuth();

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editSection, setEditSection] = useState<"basics" | "description" | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);

  async function refreshVerifiedFlag() {
    try {
      await refreshAccessToken();
      const me = await getAuthMe();
      setVerified(!!me?.verified);
    } catch {
      setVerified(null);
    }
  }

  useEffect(() => {
    // Wait until auth is hydrated to avoid hydration/CORS/cookie races
    if (!isReady) return;

    // If not logged in, stop loading and show message
    if (!user) {
      setLoading(false);
      setError("Please log in to view your company profile.");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const data = await getCompanyProfile(controller.signal); // uses credentials: 'include'
        if (!cancelled) {
          setCompany(data);
          setError(null);
        }
        // Fetch verification flag from auth/me (after token refresh in mount hook below too)
        try {
          const me = await getAuthMe();
          if (!cancelled) setVerified(!!me?.verified);
        } catch {
          if (!cancelled) setVerified(null);
        }
      } catch (err: any) {
        if (!cancelled && err?.name !== "AbortError") {
          console.error("Failed to fetch company profile:", err);
          setError(err.message || "Error loading company profile");
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

  // Refresh token + verified flag on mount and whenever the tab regains focus
  useEffect(() => {
    refreshVerifiedFlag();
    const onFocus = () => refreshVerifiedFlag();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (!isReady) {
    // Auth is still hydrating — keep things calm to avoid flashes
    return <div className="p-8 text-gray-600">Preparing your session…</div>;
  }

  if (loading) return <div className="p-8 text-gray-600">Loading company profile…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!company) return <div className="p-8 text-gray-500">No profile found. Please create one.</div>;

  const roleLower = (user?.role ?? "").toLowerCase();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* removed global Edit button; per-block editors added */}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Company card */}
        <aside className="relative rounded-2xl border bg-white p-6 shadow-sm">
          {roleLower === "company" && (
            <button
              type="button"
              onClick={() => { setEditSection('basics'); setOpenEdit(true); }}
              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50"
              title="Edit company info"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80"><path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/></svg>
            </button>
          )}
          <div className="flex flex-col items-center">
            <div
              className="relative h-28 w-28 overflow-hidden rounded-full ring-4"
              style={{
                boxShadow: `inset 0 0 0 0 rgba(0,0,0,0.04)`,
                outline: `4px solid ${GREEN}22`,
                outlineOffset: 0,
              }}
            >
              <ProfileImageUploader
                kind="company"
                initialUrl={null}
                onUpdated={() => { /* no-op: company profile fetch separate; keep current view */ }}
              />
            </div>

            <h2 className="mt-4 text-xl font-extrabold" style={{ color: GREEN }}>
              {company.company_name}
            </h2>
            <p className="text-sm text-gray-600">{company.industry}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-gray-600">Company</span>
              {verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] px-2 py-0.5 border border-emerald-200">
                  <CheckBadgeIcon className="h-4 w-4" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 border border-gray-200">
                  <ExclamationTriangleIcon className="h-4 w-4" /> Not Verified
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <InfoRow icon={<GlobeAltIcon className="h-4 w-4" />} label="Country" value={company.country} />
            <InfoRow icon={<MapPinIcon className="h-4 w-4" />} label="Location" value={company.location} />
            <InfoRow icon={<PhoneIcon className="h-4 w-4" />} label="Telephone" value={company.tel} />
          </div>
        </aside>

        {/* Description */}
        <section className="space-y-6 md:col-span-2">
          <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
            <PillHeading>Company&apos;s Description</PillHeading>
            {roleLower === "company" && (
              <button
                type="button"
                onClick={() => { setEditSection('description'); setOpenEdit(true); }}
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50"
                title="Edit description"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80"><path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/></svg>
              </button>
            )}
            <div className="mt-3 prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{company.description || "_No description yet._"}</ReactMarkdown>
            </div>
          </div>
        </section>
      </div>

      {/* Edit Modal */}
      <EditCompanyProfileModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        initial={company}
        onSaved={(updated) => setCompany(updated)}
        brandColor={GREEN}
        section={editSection || undefined}
      />
    </main>
  );
}
