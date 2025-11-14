"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getEmployeeProfileImage, getCompanyProfileImage, PROFILE_IMAGE_UPDATED_EVENT } from "@/api/profileimage";
import { getMyStudentProfile } from "@/api/studentprofile";
import { getCompanyProfile } from "@/api/companyprofile";
import { getAuthMe } from "@/api/user";
import { getMyProfessorProfile } from "@/api/professorprofile";
import RoleSelector from "@/components/roleselector";
import { useApplyCart } from "@/context/ApplyCartContext";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import NotificationsBell from "@/components/NotificationsBell";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname() || "/";
  // Avoid hydration mismatch by enabling active highlighting only after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isActive = mounted && (() => {
    if (href === "/") {
      // Treat both / and /homepage as HOME
      return pathname === "/" || pathname === "/homepage";
    }
    // Match exact or nested paths under the same section
    return pathname === href || pathname.startsWith(href + "/");
  })();
  const base = "px-3 py-1 rounded-full text-sm transition";
  const className = isActive ? "text-white" : "text-gray-700 hover:bg-gray-100";
  const style = isActive ? { backgroundColor: "#5D9252" } as React.CSSProperties : undefined; // midgreen
  return (
    <Link href={href} className={`${base} ${className}`} style={style}>
      {label}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useApplyCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showAdminNav, setShowAdminNav] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarRef = useRef<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const displayRole = (user?.role || "Unknown").slice(0,1).toUpperCase() + (user?.role || "Unknown").slice(1);
  const isAdmin = (user?.role || "").toLowerCase().includes("admin");

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    if (dropdownOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [dropdownOpen]);

  // Load profile image and display name
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    avatarRef.current = avatarUrl;
    const safeUrl = (u?: string | null) => {
      if (!u) return null;
      try {
        const url = new URL(u, typeof window !== "undefined" ? window.location.origin : undefined);
        const qp = url.searchParams;
        const isAwsSigned = qp.has("X-Amz-Algorithm") || qp.has("X-Amz-Signature");
        if (isAwsSigned) return url.toString();
        return url.toString();
      } catch {
        return u;
      }
    };
    function roleKnown(r?: string | null): r is string {
      const raw = (r || '').toLowerCase();
      return raw.includes('student') || raw.includes('company') || raw.includes('professor');
    }

    async function load() {
      if (!user) { setAvatarUrl(null); return; }
      if (!roleKnown(user.role)) {
        // Defer fetching until role is chosen to avoid 401s that would auto-logout
        setAvatarUrl(null);
        setDisplayName(user.user_name || '');
        return;
      }
      try {
        const role = (user.role || "").toLowerCase();
        let raw: string | null = null;
        try {
          if (role.includes("company")) {
            raw = await getCompanyProfileImage();
          } else if (role.includes("professor")) {
            const prof = await getMyProfessorProfile().catch(() => null as any);
            raw = (prof as any)?.profile_image_url || null;
          } else {
            raw = await getEmployeeProfileImage();
          }
        } catch {}
        // Fallbacks when no uploaded image yet: use OAuth/user profile image if present
        if (!raw) {
          try {
            if (role.includes("company")) {
              const me = await getAuthMe().catch(() => null as any);
              raw = (me as any)?.profile_image || (me as any)?.avatar_url || null;
            } else {
              const student = await getMyStudentProfile().catch(() => null as any);
              raw = (student as any)?.avatar_url || (student as any)?.profile_image || null;
            }
          } catch {}
        }
        if (!cancelled) {
          const final = safeUrl(raw || null);
          avatarRef.current = final;
          setAvatarUrl(final);
        }
      } catch {
        if (!cancelled) setAvatarUrl(null);
      }

      // Display name
      try {
        const role = (user.role || "").toLowerCase();
        if (role.includes("company")) {
          const company = await getCompanyProfile(controller.signal);
          if (!cancelled && company?.company_name) setDisplayName(company.company_name);
        } else if (role.includes("professor")) {
          const prof = await getMyProfessorProfile(controller.signal).catch(() => null as any);
          const name = prof && prof.user ? `${prof.user.first_name || ""} ${prof.user.last_name || ""}`.trim() : "";
          if (!cancelled && name) setDisplayName(name);
          if (!cancelled && !avatarRef.current && (prof as any)?.profile_image_url) {
            const u = safeUrl((prof as any).profile_image_url);
            avatarRef.current = u;
            setAvatarUrl(u);
          }
        } else {
          const student = await getMyStudentProfile();
          const name = student.full_name || student.user_name || "";
          if (!cancelled && name) setDisplayName(name);
          // Also use student profile image as fallback if still missing
          if (!cancelled && !avatarRef.current && (student as any)?.avatar_url) {
            const u = safeUrl((student as any).avatar_url);
            avatarRef.current = u;
            setAvatarUrl(u);
          }
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
    const onFocus = () => { if (user) load(); };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      controller.abort();
      window.removeEventListener(PROFILE_IMAGE_UPDATED_EVENT, onUpdated as any);
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  async function handleLogout() {
    await logout();
    setDropdownOpen(false);
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
              <>
                <NavItem href="/company/jobpostings" label="JOB POSTINGS" />
                <NavItem href="/view-resume" label="VIEW RESUME" />
              </>
            )}
            <NavItem href="/professor-annoucement" label="ANNOUNCEMENT" />
            {user?.role?.toLowerCase().includes("student") || user?.role?.toLowerCase().includes("alumni") ? (
              <NavItem href="/status" label="STATUS" />
            ) : null}
          </nav>

          <div className="relative flex items-center gap-2" ref={menuRef}>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdminNav((prev) => !prev)}
                className="hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                {showAdminNav ? "Hide Admin Links" : "Admin Links"}
              </button>
            )}
            {user ? (
              <>
                {/* Student-only: Notifications + Apply list */}
                {user?.role?.toLowerCase().includes("student") && (
                  <>
                    <NotificationsBell />
                    <Link
                      href="/apply-list"
                      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
                      aria-label="Apply list"
                    >
                      <DocumentTextIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] w-4 h-4">
                          {count}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                {/* Role badge */}
                <span className="hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700">{displayRole}</span>

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
                <button
                  onClick={() => setShowRoleSelector(true)}
                  className="text-xs px-3 py-1 rounded border"
                >
                  SIGNUP
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {isAdmin && showAdminNav && (
        <AdminNavbar />
      )}

      {showRoleSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
            <RoleSelector
              isOpen={showRoleSelector}
              onClose={() => setShowRoleSelector(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

