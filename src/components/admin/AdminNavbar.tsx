"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

export const ADMIN_BRAND_COLOR = "#5b8f5b";

const NAV_LINKS = [
  { href: "/admin", label: "Manage Users" },
  { href: "/admin/job-postings", label: "Manage Job Postings" },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const displayName = useMemo(() => {
    if (!user) return "Administrator";
    return user.user_name || user.email || "Administrator";
  }, [user]);

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <span className="text-base font-semibold text-gray-900">Admin Console</span>
          <span className="text-xs text-gray-500">Signed in as {displayName}</span>
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  active ? "text-white shadow" : "text-gray-700 hover:bg-gray-50"
                }`}
                style={{
                  backgroundColor: active ? ADMIN_BRAND_COLOR : "white",
                  borderColor: active ? ADMIN_BRAND_COLOR : "#e5e7eb",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
