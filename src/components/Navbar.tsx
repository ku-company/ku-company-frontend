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
import { DocumentTextIcon } from "@heroicons/react/24/outline";

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
  return (
    <Link
      href={href}
      className={`btn btn-sm rounded-full ${isActive ? "btn-primary text-white" : "btn-ghost text-base-content"}`}
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
  // Ensure SSR and CSR markup matches to avoid hydration warnings
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

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
        const raw = role.includes("company")
          ? await getCompanyProfileImage()
          : await getEmployeeProfileImage();
        if (!cancelled) setAvatarUrl(safeUrl(raw));
      } catch {
        if (!cancelled) setAvatarUrl(null);
      }

      // Display name
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
      <header suppressHydrationWarning className="sticky top-0 z-40 border-b bg-base-100 shadow-sm">
        <div className="navbar mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 w-full">
          {/* Left: brand + mobile dropdown */}
          <div className="navbar-start gap-3">
            <div className="dropdown md:hidden">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-56">
                <li><Link href="/homepage">HOME</Link></li>
                <li><Link href="/find-job">FIND JOB</Link></li>
                {user?.role?.toLowerCase().includes("company") && (
                  <>
                    <li><Link href="/company/jobpostings">JOB POSTINGS</Link></li>
                    <li><Link href="/view-resume">VIEW RESUME</Link></li>
                  </>
                )}
                <li><Link href="/professor-annoucement">ANNOUNCEMENT</Link></li>
                {(user?.role?.toLowerCase().includes("student") || user?.role?.toLowerCase().includes("alumni")) && (
                  <li><Link href="/status">STATUS</Link></li>
                )}
              </ul>
            </div>
            <Link href="/homepage" className="font-extrabold tracking-wider text-primary">
              KU-COMPANY
            </Link>
          </div>

          {/* Center: desktop nav */}
          <div className="navbar-center hidden md:flex">
            <nav className="flex items-center gap-1">
              <NavItem href="/homepage" label="HOME" />
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
          </div>

          {/* Right: search + user actions */}
          <div className="navbar-end gap-3" ref={menuRef}>
            {!hydrated ? null : user ? (
              <>
                  <span className="hidden sm:inline-flex items-center badge badge-outline badge-sm">
                    {displayRole}
                  </span>

                  {user?.role?.toLowerCase().includes("student") && (
                    <Link
                      href="/apply-list"
                      className="btn btn-circle btn-ghost"
                      aria-label="Apply list"
                    >
                      <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
                      {count > 0 && (
                        <span className="badge badge-sm badge-error absolute -top-1 -right-1">
                          {count}
                        </span>
                      )}
                    </Link>
                  )}

                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="avatar placeholder"
                      onClick={() => setDropdownOpen((v) => !v)}
                    >
                      <div className="w-9 rounded-full ring ring-base-300 overflow-hidden">
                        <img src={avatarUrl || "/icons/default-profile.png"} alt={`${displayName || user.user_name} avatar`} />
                      </div>
                    </div>
                    {dropdownOpen && (
                      <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-56 p-2 shadow">
                        <li className="menu-title text-xs">
                          <span>Signed in as {displayName || user.user_name}</span>
                          <span>Role: {displayRole}</span>
                        </li>
                        <li>
                          <Link href="/profile" onClick={() => setDropdownOpen(false)}>Profile</Link>
                        </li>
                        <li>
                          <button onClick={handleLogout} className="text-error">Logout</button>
                        </li>
                      </ul>
                    )}
                  </div>
              </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-sm btn-ghost rounded-full">LOGIN</Link>
                  <button onClick={() => setShowRoleSelector(true)} className="btn btn-sm btn-primary rounded-full text-white">
                    SIGN UP
                  </button>
                </>
              )}
          </div>
        </div>
      </header>

      {showRoleSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-0 rounded-2xl shadow-xl w-full max-w-md">
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

