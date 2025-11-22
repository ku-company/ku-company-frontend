"use client";

import Image from "next/image";
import { MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getCompanyProfileById, type PublicCompanyProfile } from "@/api/companyprofile";

function PillHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

function CornerIcon({ title }: { title: string }) {
  return (
    <span
      title={title}
      className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path
          d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
          fill="currentColor"
        />
      </svg>
    </span>
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

export default function CompanyProfileByIdPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = useMemo(() => Number(params?.companyId), [params]);
  const [profile, setProfile] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(companyId) || companyId <= 0) {
      setError("Invalid company id");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCompanyProfileById(companyId, controller.signal);
        if (!active) return;
        if (!data) {
          setError("Company profile not found");
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (err: any) {
        if (!active || controller.signal.aborted) return;
        setError(err?.message || "Failed to load company profile");
        setProfile(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId]);

  if (loading) {
    return <div className="p-6 text-gray-600">Loading company profile…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="p-6 text-gray-600">Company profile is unavailable.</div>;
  }

  const GREEN = "#5D9252";
  const description = profile.description?.trim() || "No description provided yet.";

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-wide text-gray-500">Company profile</p>
        <h1 className="text-3xl font-bold text-gray-900">{profile.company_name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <aside className="relative rounded-2xl border bg-white p-6 shadow-sm">
          <CornerIcon title="Company profile" />
          <div className="flex flex-col items-center">
            <div
              className="relative h-28 w-28 overflow-hidden rounded-full ring-4"
              style={{ boxShadow: "inset 0 0 0 0 rgba(0,0,0,0.04)", outline: `4px solid ${GREEN}22`, outlineOffset: 0 }}
            >
              <Image
                src="/company-logo.png"
                alt={`${profile.company_name} logo`}
                fill
                className="object-cover"
              />
            </div>

            <h2 className="mt-4 text-xl font-extrabold" style={{ color: GREEN }}>
              {profile.company_name}
            </h2>
            <p className="text-sm text-gray-600">{profile.industry || "Industry not specified"}</p>
          </div>

          <div className="mt-6 space-y-4">
            <InfoRow
              icon={<MapPinIcon className="h-4 w-4" />}
              label="Location"
              value={profile.location || profile.country || "Location not provided"}
            />
            <InfoRow
              icon={<PhoneIcon className="h-4 w-4" />}
              label="Telephone"
              value={profile.tel || "Not provided"}
            />
          </div>
        </aside>

        <section className="space-y-6 md:col-span-2">
          <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
            <CornerIcon title="Company description" />
            <PillHeading>Company's Description</PillHeading>
            <p className="mt-3 text-sm leading-6 text-gray-700">{description}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
