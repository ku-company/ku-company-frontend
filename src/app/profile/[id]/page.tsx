"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { buildInit, API_BASE } from "@/api/base";
import StudentProfileView from "@/components/profile/StudentProfileView";
import CompanyProfileView from "@/components/profile/CompanyProfileView";
import ProfessorProfileView from "@/components/profile/ProfessorProfileView";

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
        const res = await fetch(`${API_BASE}/api/user/profile/${id}`, buildInit({ method: "GET", credentials: "include" }));
        const json = await res.text();
        let data: any = {};
        try { data = JSON.parse(json); } catch {}
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
    return <CompanyProfileView readOnly profileData={companyData} />;
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
  return <StudentProfileView readOnly profileData={studentData} />;
}
