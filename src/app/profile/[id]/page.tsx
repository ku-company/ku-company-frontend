"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { buildInit, API_BASE } from "@/api/base";

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
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
        if (alive) setProfile(json?.data ?? json);
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

  const role = (profile?.user?.role || "").toString();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Public Profile</h1>
          <Link href="/profile" className="text-sm text-emerald-700 hover:underline">My Profile</Link>
        </div>

        <div className="mt-4 text-sm text-gray-600">Role: <span className="font-medium">{role}</span></div>

        {role === "Company" && (
          <div className="mt-4 space-y-1 text-sm">
            <div className="text-lg font-semibold">{profile.company_name || profile.user?.company_name || "Company"}</div>
            <div className="text-gray-700 whitespace-pre-wrap">{profile.description || "-"}</div>
            <div className="text-gray-700">Industry: {profile.industry || "-"}</div>
            <div className="text-gray-700">Telephone: {profile.tel || "-"}</div>
            <div className="text-gray-700">Location: {profile.location || "-"}</div>
            <div className="text-gray-700">Country: {profile.country || "-"}</div>
          </div>
        )}

        {(role === "Student" || role === "Alumni") && (
          <div className="mt-4 space-y-1 text-sm">
            <div className="text-lg font-semibold">{`${profile.user?.first_name || ""} ${profile.user?.last_name || ""}`.trim() || "Student"}</div>
            <div className="text-gray-700">Summary: {profile.summary || "-"}</div>
            <div className="text-gray-700">Skills: {profile.skills || "-"}</div>
            <div className="text-gray-700">Languages: {profile.languages || "-"}</div>
            <div className="text-gray-700">Education: {profile.education || "-"}</div>
          </div>
        )}

        {role === "Professor" && (
          <div className="mt-4 space-y-1 text-sm">
            <div className="text-lg font-semibold">{`${profile.user?.first_name || ""} ${profile.user?.last_name || ""}`.trim() || "Professor"}</div>
            <div className="text-gray-700">Department: {profile.department || "-"}</div>
            <div className="text-gray-700">Faculty: {profile.faculty || "-"}</div>
            <div className="text-gray-700">Contact: {profile.contactInfo || "-"}</div>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">Read-only view</div>
      </div>
    </main>
  );
}

