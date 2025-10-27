"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getEmployeeProfileImage,
  PROFILE_IMAGE_UPDATED_EVENT,
} from "@/api/profileimage";

const GREEN = "#5b8f5b";

/* ---------- NavItem ---------- */
function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isActive =
    mounted &&
    (pathname === href || pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-full text-sm transition font-medium ${
        isActive
          ? "bg-emerald-700 text-white"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}

/* ---------- Professor Navbar ---------- */
export default function ProfessorNavbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [dropdownOpen]);

  // โหลดรูปโปรไฟล์ + ชื่อ professor
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const img = await getEmployeeProfileImage();
        if (!cancelled) setAvatarUrl(img);
        if (!cancelled && user?.user_name)
          setDisplayName(user.user_name);
      } catch {
        if (!cancelled) setAvatarUrl(null);
      }
    }

    loadProfile();

    const onUpdated = (e: any) => {
      const u = e?.detail?.url as string | undefined;
      if (u) setAvatarUrl(u);
    };
    window.addEventListener(PROFILE_IMAGE_UPDATED_EVENT, onUpdated as any);

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_IMAGE_UPDATED_EVENT, onUpdated as any);
    };
  }, [user]);

  // Logout
  function handleLogout() {
    logout();
    setDropdownOpen(false);
    router.push("/login");
  }

  // เมนูสำหรับ professor
  const navItems = [
    { name: "Home", path: "/homepage" },
    { name: "Announcement", path: "/professor-announcement" },
    { name: "Dashboard", path: "/professor-dashboard" },
    { name: "Profile", path: "/professor-profile" },
  ];

  // ถ้าไม่ได้ล็อกอินเป็น professor → ไม่แสดง navbar นี้
  if (!user || user.role?.toLowerCase() !== "professor") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand */}
        <Link
          href="/professor-home"
          className="font-extrabold text-lg tracking-wide"
          style={{ color: GREEN }}
        >
          KU-COMPANY
        </Link>

        {/* Center: Nav links */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <NavItem key={item.path} href={item.path} label={item.name} />
          ))}
        </nav>

        {/* Right: User dropdown */}
        <div className="relative flex items-center gap-2" ref={menuRef}>
          <span className="hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700">
            Professor
          </span>

          <button
            className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen ? "true" : "false"}
          >
            <img
              src={avatarUrl || "/icons/default-profile.png"}
              alt="Professor avatar"
              className="w-full h-full object-cover"
            />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 top-12 w-48 bg-white border rounded-lg shadow-lg py-2"
            >
              <div className="px-4 pb-2 text-xs text-gray-500">
                Signed in as{" "}
                <span className="font-medium">
                  {displayName || "Professor"}
                </span>
                <div>
                  Role: <span className="font-medium">Professor</span>
                </div>
              </div>

              <Link
                href="/professor-profile"
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
        </div>
      </div>
    </header>
  );
}
