"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getEmployeeProfileImage, getCompanyProfileImage, PROFILE_IMAGE_UPDATED_EVENT } from "@/api/profileimage";
import { getMyStudentProfile } from "@/api/studentprofile";
import { getCompanyProfile } from "@/api/companyprofile";
import RoleSelector from "@/components/roleselector";
import { useApplyCart } from "@/context/ApplyCartContext";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-full text-sm transition
        ${active ? "bg-emerald-700 text-white" : "text-gray-700 hover:bg-gray-100"}`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { count } = useApplyCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const displayRole = (user?.role || "Unknown").slice(0,1).toUpperCase() + (user?.role || "Unknown").slice(1);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    if (dropdownOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [dropdownOpen]);

  // Load profile image for navbar based on role
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const safeUrl = (u?: string | null) => {
      if (!u) return null;
      try {
        const url = new URL(u, typeof window !== "undefined" ? window.location.origin : undefined);
        const qp = url.searchParams;
        const isAwsSigned = qp.has("X-Amz-Algorithm") || qp.has("X-Amz-Signature");
        // Do NOT modify pre-signed S3 URLs. They must match the signature exactly.
        if (isAwsSigned) return url.toString();
        return url.toString();
      } catch {
        return u;
      }
    };
    async function load() {
      if (!user) { setAvatarUrl(null); return; }
      try {
        const role = (user.role || "").toLowerCase();
        const raw = role.includes("company")
          ? await getCompanyProfileImage()
          : await getEmployeeProfileImage();
        if (!cancelled) setAvatarUrl(safeUrl(raw));
      } catch {
        if (!cancelled) setAvatarUrl(null);
      }
      // Also fetch a fresher display name from profile
      try {
        const role = (user.role || "").toLowerCase();
        if (role.includes("company")) {
          const company = await getCompanyProfile(controller.signal);
          if (!cancelled && company?.company_name) setDisplayName(company.company_name);
        } else {
          const student = await getMyStudentProfile();
          const name = student.full_name || student.user_name || "";
          if (!cancelled && name) setDisplayName(name);
        }
      } catch {
        if (!cancelled) setDisplayName(user.user_name);
      }
    }
    load();
    const onUpdated = (e: any) => {
      const u = e?.detail?.url as string | undefined;
      if (u) setAvatarUrl(safeUrl(u));
    };
    window.addEventListener(PROFILE_IMAGE_UPDATED_EVENT, onUpdated as any);
    return () => {
      cancelled = true;
      controller.abort();
      window.removeEventListener(PROFILE_IMAGE_UPDATED_EVENT, onUpdated as any);
    };
  }, [user]);

  function handleLogout() {
    logout();
    setDropdownOpen(false);
    router.push("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-widest">
            KU-COMPANY
          </Link>

          <div className="hidden md:block">
            <input
              placeholder="SEARCH"
              className="h-9 w-64 rounded-full border px-4 text-sm focus:outline-none focus:ring"
            />
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <NavItem href="/" label="HOME" />
            <NavItem href="/find-job" label="FIND JOB" />
            {user?.role?.toLowerCase().includes("company") && (
              <NavItem href="/company/jobpostings" label="JOB POSTINGS" />
            )}
            <NavItem href="/announcement" label="ANNOUNCEMENT" />
          </nav>

          <div className="relative flex items-center gap-2" ref={menuRef}>
            {user ? (
              <>
                {/* Role badge */}
                <span className="hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700">{displayRole}</span>

                {/* Apply list icon (students only) */}
                {user?.role?.toLowerCase().includes("student") && (
                  <Link
                    href="/apply-list"
                    className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
                    aria-label="Apply list"
                  >
                    <span role="img" aria-label="apply-list">📝</span>
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] w-4 h-4">
                        {count}
                      </span>
                    )}
                  </Link>
                )}

                <button
                  className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen ? "true" : "false"}
                >
                  <img
                    src={avatarUrl || "/icons/default-profile.png"}
                    alt={`${displayName || user.user_name} avatar`}
                    className="w-full h-full object-cover"
                  />
                </button>

                {dropdownOpen && (
                  <div role="menu" className="absolute right-0 top-12 w-48 bg-white border rounded-lg shadow-lg py-2">
                    <div className="px-4 pb-2 text-xs text-gray-500">Signed in as <span className="font-medium">{displayName || user.user_name}</span>
                      <div>Role: <span className="font-medium">{displayRole}</span></div></div>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs px-3 py-1 rounded border">
                  LOGIN
                </Link>
                <button onClick={() => setShowRoleSelector(true)} className="text-xs px-3 py-1 rounded border">
                  SIGNUP
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {showRoleSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
            <RoleSelector isOpen={showRoleSelector} onClose={() => setShowRoleSelector(false)} />
          </div>
        </div>
      )}
    </>
  );
}
