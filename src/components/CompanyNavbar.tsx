"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const GREEN = "#5b8f5b";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

interface CompanyProfile {
  company_name: string;
  logo_url?: string;
}

export default function CompanyNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/api/company/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Error fetching company profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/company/jobpostings?search=${encodeURIComponent(search)}`);
  };

  const handleLogout = () => {
    logout?.();
    window.location.href = "/login";
  };

  const navItems = [
    { name: "HOME", href: "/company/dashboard" },
    { name: "JOB POSTING", href: "/company/jobpostings" },
    { name: "DASHBOARD", href: "/company/announcement" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-2">
        {/* ---------- Left: Logo + Search ---------- */}
        <div className="flex items-center gap-6">
          <Link
            href="/company/dashboard"
            className="font-semibold text-sm tracking-wide text-gray-900"
          >
            KU-COMPANY
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH"
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-full w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-[#5b8f5b]"
            />
          </form>
        </div>

        {/* ---------- Center: Nav ---------- */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] font-medium transition-all ${
                  isActive
                    ? "text-[#5b8f5b] border-b-[2px] border-[#5b8f5b] pb-0.5"
                    : "text-gray-700 hover:text-[#5b8f5b]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* ---------- Right: Profile ---------- */}
        <div className="flex items-center gap-2">
          <img
            src={profile?.logo_url || "/icons/default-profile.png"}
            alt="Logo"
            className="h-8 w-8 rounded-full border border-gray-200 object-cover"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-medium text-gray-800 truncate max-w-[150px]">
              {profile?.company_name || user?.user_name || "Company"}
            </span>
            <button
              onClick={handleLogout}
              className="text-[11px] text-gray-500 hover:text-red-600 font-medium"
            >
              LOG OUT
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
