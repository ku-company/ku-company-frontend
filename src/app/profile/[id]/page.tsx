"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { buildInit, API_BASE } from "@/api/base";
import StudentProfileView from "@/components/profile/StudentProfileView";
import CompanyProfileView from "@/components/profile/CompanyProfileView";
import ProfessorProfileView from "@/components/profile/ProfessorProfileView";
import CompanyComments from "@/components/CompanyComments";

type AnyProfile = any;

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AnyProfile | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const url = `${API_BASE}/api/user/profile/${id}`;
        const init = buildInit({ method: "GET", credentials: "include" });

        // --- Debug log: outbound request ---
        try {
          const headersAny: any = (init as any).headers || {};
          const sanitizedHeaders: Record<string, any> = { ...headersAny };
          const authKey = Object.keys(sanitizedHeaders).find(k => k.toLowerCase() === 'authorization');
          if (authKey) sanitizedHeaders[authKey] = '(redacted)';
          console.groupCollapsed(`[PublicProfile] GET ${url}`);
          console.log('request', {
            method: init.method || 'GET',
            credentials: (init as any).credentials,
            headers: sanitizedHeaders,
          });
          console.groupEnd();
        } catch {}

        const res = await fetch(url, init);
        const text = await res.text();
        // --- Debug log: inbound response ---
        try {
          console.groupCollapsed(`[PublicProfile] Response ${url}`);
          console.log('response', { status: res.status, ok: res.ok, preview: text.slice(0, 600) });
          console.groupEnd();
        } catch {}

        let data: any = {};
        try { data = JSON.parse(text); } catch {}
        // Log the parsed JSON that backend sent
        try {
          console.groupCollapsed(`[PublicProfile] Response JSON ${url}`);
          console.log('json', data);
          console.groupEnd();
        } catch {}
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        if (alive) setProfile(data?.data ?? data);
        if (alive) setError(null);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load profile");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (!id) return <div className="p-6">Missing id</div>;
  if (loading) return <div className="p-6 text-gray-600">Loading profile…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!profile) return <div className="p-6 text-gray-600">Profile not found.</div>;

  const role = (profile?.user?.role || "").toString().toLowerCase();

  // Map generic payloads to specific component shapes
  if (role.includes("company")) {
    const companyData = {
      company_name: profile.company_name || profile.user?.company_name || "",
      description: profile.description || "",
      industry: profile.industry || "",
      tel: profile.tel || "",
      location: profile.location || profile.company_location || "",
      country: profile.country || "",
    } as any;
    const companyProfileId = Number(profile?.id || 0) || undefined;
    const companyUserId = Number(id);
    const verified = !!(profile?.user?.verified);
    return (
      <>
        <CompanyProfileView readOnly profileData={companyData} verifiedOverride={verified} companyProfileId={companyProfileId} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <CompanyComments companyUserId={companyUserId} companyProfileId={companyProfileId} />
        </div>
      </>
    );
  }

  if (role.includes("professor")) {
    const professorData = {
      department: profile.department || "",
      faculty: profile.faculty || "",
      position: profile.position || null,
      contactInfo: profile.contactInfo || null,
      summary: profile.summary || null,
      profile_image_url: profile.user?.profile_image || null,
      user: {
        first_name: profile.user?.first_name || "",
        last_name: profile.user?.last_name || "",
        email: profile.user?.email || "",
        verified: !!profile.user?.verified,
      },
    } as any;
    return <ProfessorProfileView readOnly profileData={professorData} />;
  }

  // default to student/alumni
  const studentData = {
    id: profile?.id || profile?.user?.id,
    user_name: profile?.user?.user_name || "",
    email: profile?.user?.email || "",
    verified: !!profile?.user?.verified,
    first_name: profile?.user?.first_name || "",
    last_name: profile?.user?.last_name || "",
    full_name: [profile?.user?.first_name || "", profile?.user?.last_name || ""].filter(Boolean).join(" ").trim(),
    avatar_url: profile?.user?.profile_image || "",
    bio: profile?.summary || profile?.bio || null,
    birthday: profile?.birthDate || profile?.birthday || null,
    education: profile?.education ?? null,
    skills: profile?.skills ?? null,
    licenses: profile?.licenses ?? null,
    languages: profile?.languages ?? null,
    experience: profile?.experience ?? null,
    contactInfo: profile?.contactInfo ?? null,
  } as any;
  return <StudentProfileView readOnly profileData={studentData} verifiedOverride={!!profile?.user?.verified} />;
}
