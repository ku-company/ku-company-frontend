"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // click outside to close
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    if (dropdownOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [dropdownOpen]);

  function handleLogout() {
    logout();
    setDropdownOpen(false);
    router.push("/login");
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-semibold tracking-widest">
          KU-COMPANY
        </Link>

        {/* Search */}
        <div className="hidden md:block">
          <input
            placeholder="SEARCH"
            className="h-9 w-64 rounded-full border px-4 text-sm focus:outline-none focus:ring"
          />
        </div>

        {/* Main links */}
        <nav className="hidden md:flex items-center gap-2">
          <NavItem href="/" label="HOME" />
          <NavItem href="/find-job" label="FIND JOB" />
          <NavItem href="/announcement" label="ANNOUNCEMENT" />
        </nav>

        {/* Auth/Profile */}
        <div className="relative flex items-center gap-2" ref={menuRef}>
          {user ? (
            <>
              <button
                className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
              >
                <img
                  src="/icons/default-profile.png"
                  alt={`${user.user_name} avatar`}
                  className="w-full h-full object-cover"
                />
              </button>

              {dropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-44 bg-white border rounded-lg shadow-lg py-2"
                >
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
              <Link href="/register" className="text-xs px-3 py-1 rounded border">
                SIGNUP
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
