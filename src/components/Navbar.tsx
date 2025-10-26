"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getEmployeeProfileImage,
  getCompanyProfileImage,
  PROFILE_IMAGE_UPDATED_EVENT,
} from "@/api/profileimage";
import { getMyStudentProfile } from "@/api/studentprofile";
import { getCompanyProfile } from "@/api/companyprofile";
import RoleSelector from "@/components/roleselector";
import { useApplyCart } from "@/context/ApplyCartContext";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

/* ─────────────────────────────── NavItem ─────────────────────────────── */
function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isActive =
    mounted &&
    (() => {
      if (href === "/") return pathname === "/" || pathname === "/homepage";
      return pathname === href || pathname.startsWith(href + "/");
    })();

  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all duration-300 ${
        isActive
          ? "bg-[#5b8f5b] text-white shadow-md"
          : "text-gray-700 hover:text-[#5b8f5b] hover:bg-[#5b8f5b]/10"
      }`}
    >
      {label}
    </Link>
  );
}

/* ─────────────────────────────── Navbar ─────────────────────────────── */
export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { count } = useApplyCart();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const displayRole =
    (user?.role || "Unknown").slice(0, 1).toUpperCase() +
    (user?.role || "Unknown").slice(1);

  /* 🧩 Load profile + image */
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const safeUrl = (u?: string | null) => {
      if (!u) return null;
      try {
        const url = new URL(
          u,
          typeof window !== "undefined" ? window.location.origin : undefined
        );
        return url.toString();
      } catch {
        return u;
      }
    };

    async function load() {
      if (!user) {
        setAvatarUrl(null);
        return;
      }
      try {
        const role = user.role?.toLowerCase() || "";
        const raw = role.includes("company")
          ? await getCompanyProfileImage()
          : await getEmployeeProfileImage();
        if (!cancelled) setAvatarUrl(safeUrl(raw));
      } catch {
        if (!cancelled) setAvatarUrl(null);
      }

      try {
        const role = user.role?.toLowerCase() || "";
        if (role.includes("company")) {
          const company = await getCompanyProfile(controller.signal);
          if (!cancelled && company?.company_name)
            setDisplayName(company.company_name);
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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  /* ─────────────────────────────── Render ─────────────────────────────── */
  return (
    <>
      <nav className="backdrop-blur-md bg-white/80 border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-5 py-3">
          {/* Left Logo */}
          <Link
            href="/"
            className="text-[#5b8f5b] text-lg font-extrabold tracking-wide hover:text-emerald-700 transition-colors"
          >
            KU-COMPANY
          </Link>

          {/* Center Menu */}
          <div className="hidden lg:flex gap-2">
            <NavItem href="/" label="HOME" />
            <NavItem href="/find-job" label="FIND JOB" />
            {user?.role?.toLowerCase().includes("company") && (
              <>
                <NavItem href="/company/jobpostings" label="JOB POSTINGS" />
                <NavItem href="/view-resume" label="VIEW RESUME" />
              </>
            )}
            <NavItem href="/professor-annoucement" label="ANNOUNCEMENT" />
            {(user?.role?.toLowerCase().includes("student") ||
              user?.role?.toLowerCase().includes("alumni")) && (
              <NavItem href="/status" label="STATUS" />
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Apply Cart */}
                {user.role?.toLowerCase().includes("student") && (
                  <Link
                    href="/apply-list"
                    className="relative flex items-center justify-center hover:scale-110 transition-transform"
                    aria-label="Apply list"
                  >
                    <DocumentTextIcon className="h-5 w-5 text-[#5b8f5b]" />
                    {count > 0 && (
                      <span className="badge badge-error badge-xs absolute -top-1 -right-1 text-white">
                        {count}
                      </span>
                    )}
                  </Link>
                )}

                {/* Avatar Dropdown */}
                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#5b8f5b] hover:scale-105 transition-transform duration-200"
                  >
                    <img
                      src={avatarUrl || "/icons/default-profile.png"}
                      alt="profile"
                      className="object-cover w-full h-full"
                    />
                  </div>

                  <ul
                    tabIndex={0}
                    className="menu menu-sm dropdown-content mt-3 z-[1] bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl rounded-2xl w-60 p-4 animate-fade-in"
                  >
                    <li className="mb-2 border-b border-gray-100 pb-3 text-xs text-gray-500">
                      <p className="font-semibold text-gray-800 mb-0.5">
                        {displayName || user.user_name}
                      </p>
                      <p className="text-gray-500 text-xs">Role: 
                        <span className="text-[#5b8f5b] font-medium ml-1">{displayRole}</span>
                      </p>
                    </li>
                    <li>
                      <Link
                        href="/profile"
                        className="text-gray-700 font-medium rounded-md hover:bg-[#5b8f5b]/10 transition-colors px-2 py-1"
                      >
                        View Profile
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="text-red-500 font-medium hover:bg-red-50 rounded-md transition px-2 py-1"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="rounded-full border border-[#5b8f5b] text-[#5b8f5b] px-5 py-1.5 text-sm font-medium hover:bg-[#5b8f5b] hover:text-white transition-all duration-200"
                >
                  LOGIN
                </Link>
                <button
                  onClick={() => setShowRoleSelector(true)}
                  className="rounded-full bg-[#5b8f5b] text-white px-5 py-1.5 text-sm font-medium hover:bg-emerald-700 transition-all duration-200"
                >
                  SIGN UP
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ───── Role Selector Modal ───── */}
      {showRoleSelector && (
        <dialog open className="modal">
          <div
            className="modal-box bg-white rounded-2xl border border-gray-100 
                        w-full max-w-4xl flex flex-col items-center justify-center py-10 overflow-visible shadow-xl"
          >
            <h2 className="text-2xl font-semibold text-[#5b8f5b] mb-8 text-center">
              Select Your Role
            </h2>
            <div className="w-full flex justify-center overflow-hidden">
              <RoleSelector
                isOpen={showRoleSelector}
                onClose={() => setShowRoleSelector(false)}
              />
            </div>
          </div>

          <form
            method="dialog"
            className="modal-backdrop bg-black/40 backdrop-blur-sm"
          >
            <button onClick={() => setShowRoleSelector(false)}>close</button>
          </form>
        </dialog>
      )}
    </>
  );
}
