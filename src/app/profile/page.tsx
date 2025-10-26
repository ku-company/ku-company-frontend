"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentProfileView from "@/components/profile/StudentProfileView";
import CompanyProfileView from "@/components/profile/CompanyProfileView";
import { fetchAuthMe, normalizeRole } from "@/api/session";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isReady, login } = useAuth();
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    let alive = true;

    async function ensureSession() {
      if (user) {
        if (alive) {
          setChecking(false);
          setTimeout(() => setFadeIn(true), 100);
        }
        return;
      }

      if (!isReady) return;

      try {
        const me = await fetchAuthMe();
        if (!me) {
          router.replace("/login");
          return;
        }

        const role = normalizeRole(me.role ?? me.roles) || "Student";
        login({
          access_token: localStorage.getItem("access_token") ?? "",
          refresh_token: localStorage.getItem("refresh_token") ?? "",
          user_name: me.user_name ?? "",
          email: me.email ?? "",
          roles: role,
        });

        if (alive) {
          setChecking(false);
          setTimeout(() => setFadeIn(true), 100);
        }
      } catch {
        router.replace("/login");
      }
    }

    ensureSession();
    return () => {
      alive = false;
    };
  }, [user, isReady, login, router]);

  if (checking)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f0fff4] via-[#e6f7ed] to-[#daf2e4]">
        <div className="w-16 h-16 border-4 border-[#5b8f5b]/40 border-t-[#5b8f5b] rounded-full animate-spin mb-6"></div>
        <p className="text-[#5b8f5b] font-medium">Loading your profile...</p>
      </div>
    );

  if (!user) return null;
  const role = (user.role || "").toLowerCase();

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-[#ecfdf3] via-[#f7fffb] to-[#e1f7ec] relative overflow-hidden transition-opacity duration-700 ${
        fadeIn ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Decorative Background */}
      <div className="absolute top-[-150px] left-[-100px] w-[400px] h-[400px] bg-emerald-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-200px] right-[-150px] w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl" />

      {/* Header Section */}
      <div className="relative text-center pt-12 pb-16">
        <div className="relative inline-block">
          {/* Profile Avatar */}
          <div className="w-32 h-32 mx-auto rounded-full border-8 border-white shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 rounded-full bg-emerald-200/30 blur-lg"></div>
            <img
              src="/icons/default-profile.png"
              alt="profile avatar"
              className="w-full h-full object-cover relative z-10"
            />
          </div>

          {/* Role Tag */}
          <div className="absolute bottom-1 right-2 bg-[#5b8f5b] text-white text-xs px-3 py-0.5 rounded-full shadow-md">
            {role === "company" ? "Company" : "Student"}
          </div>
        </div>

        {/* Username */}
        <h1 className="text-3xl font-bold mt-5 text-[#2e4b2e]">
          {user.user_name || "Your Profile"}
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          {role === "company"
            ? "Explore your company presence and opportunities."
            : "Showcase your skills, education, and experiences."}
        </p>
      </div>

      {/* Profile Content Card */}
      <div className="max-w-6xl mx-auto px-5">
        <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-2xl p-8 md:p-10 relative z-10">
          {/* Tabs */}
          <div className="flex justify-center gap-6 mb-6 border-b border-gray-200 pb-2">
            {[
              { id: "overview", label: "Overview" },
              { id: "details", label: "Details" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm font-medium tracking-wide transition-all duration-300 ${
                  activeTab === tab.id
                    ? "text-[#5b8f5b] border-b-2 border-[#5b8f5b]"
                    : "text-gray-500 hover:text-[#5b8f5b]/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === "overview" && (
              <div>
                <h2 className="text-2xl font-semibold text-[#5b8f5b] mb-4">
                  Overview
                </h2>
                <p className="text-gray-600 mb-6">
                  {role === "company"
                    ? "Your company’s overview, mission statement, and job listings will appear here."
                    : "A quick summary of your education, achievements, and career interests."}
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:shadow-md transition">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Account Type
                    </h3>
                    <p className="text-gray-500 capitalize">{role}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:shadow-md transition">
                    <h3 className="font-semibold text-gray-800 mb-2">Email</h3>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "details" && (
              <div>
                <h2 className="text-2xl font-semibold text-[#5b8f5b] mb-5">
                  {role === "company"
                    ? "Company Information"
                    : "Profile Details"}
                </h2>
                {role === "company" ? (
                  <CompanyProfileView />
                ) : (
                  <StudentProfileView />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 mb-5 text-gray-400 text-sm">
        KU-Company © {new Date().getFullYear()} — Connecting talent & innovation 🌱
      </div>
    </div>
  );
}
