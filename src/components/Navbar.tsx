"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isActive = mounted && (() => {
    if (href === "/") return pathname === "/" || pathname === "/homepage";
    return pathname === href || pathname.startsWith(href + "/");
  })();

  return (
    <Link
      href={href}
      className={`btn btn-ghost btn-sm rounded-full text-sm font-medium transition ${
        isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
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
  const displayRole =
    (user?.role || "Unknown").slice(0, 1).toUpperCase() +
    (user?.role || "Unknown").slice(1);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [dropdownOpen]);

  // โหลดโปรไฟล์และชื่อ
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

      // Display name
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
    setDropdownOpen(false);
    router.push("/login");
  };

  return (
    <>
      <div className="navbar bg-base-100 border-b shadow-sm px-4 lg:px-8">
        {/* ───── Left: Logo ───── */}
        <div className="navbar-start">
          <Link href="/" className="text-primary text-lg font-bold">
            KU-COMPANY
          </Link>
        </div>

        {/* ───── Center: Menu ───── */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><NavItem href="/" label="HOME" /></li>
            <li><NavItem href="/find-job" label="FIND JOB" /></li>
            {user?.role?.toLowerCase().includes("company") && (
              <>
                <li><NavItem href="/company/jobpostings" label="JOB POSTINGS" /></li>
                <li><NavItem href="/view-resume" label="VIEW RESUME" /></li>
              </>
            )}
            <li><NavItem href="/announcement" label="ANNOUNCEMENT" /></li>
            {(user?.role?.toLowerCase().includes("student") ||
              user?.role?.toLowerCase().includes("alumni")) && (
              <li><NavItem href="/status" label="STATUS" /></li>
            )}
          </ul>
        </div>

        {/* ───── Right: Profile & Auth ───── */}
        <div className="navbar-end flex items-center gap-2" ref={menuRef}>
          {user ? (
            <>
              {/* Apply Cart */}
              {user.role?.toLowerCase().includes("student") && (
                <Link
                  href="/apply-list"
                  className="btn btn-ghost btn-circle relative"
                  aria-label="Apply list"
                >
                  <DocumentTextIcon className="h-5 w-5 text-primary" />
                  {count > 0 && (
                    <span className="badge badge-error badge-xs absolute top-1 right-1 text-white">
                      {count}
                    </span>
                  )}
                </Link>
              )}

              {/* Avatar dropdown */}
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-circle avatar"
                >
                  <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img
                      src={avatarUrl || "/icons/default-profile.png"}
                      alt="profile"
                    />
                  </div>
                </div>

                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li className="text-xs text-gray-500 px-2 mb-1">
                    Signed in as
                    <br />
                    <span className="font-medium text-gray-700">
                      {displayName || user.user_name}
                    </span>
                    <br />
                    Role: <span className="text-primary font-medium">{displayRole}</span>
                  </li>
                  <li>
                    <Link href="/profile">Profile</Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="text-error">
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline btn-sm text-primary">
                LOGIN
              </Link>
              <button
                onClick={() => setShowRoleSelector(true)}
                className="btn btn-primary btn-sm text-white"
              >
                SIGNUP
              </button>
            </>
          )}
        </div>
      </div>

      {/* ───── Role Selector Modal ───── */}
      {showRoleSelector && (
        <dialog open className="modal">
          <div className="modal-box">
            <RoleSelector
              isOpen={showRoleSelector}
              onClose={() => setShowRoleSelector(false)}
            />
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowRoleSelector(false)}>close</button>
          </form>
        </dialog>
      )}
    </>
  );
}
