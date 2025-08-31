"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Small helper that highlights the current page */
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

/** Top navigation bar (sticky) */
export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // check if user is logged in by looking for token
    const token = localStorage.getItem("access_token");
    const username = localStorage.getItem("user_name");
    if (token && username) {
      setUser(username);
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    setUser(null);
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

        {/* Search (optional) */}
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
        <div className="relative flex items-center gap-2">
          {user ? (
            <>
              <div
                className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <img
                  src="/icons/default-profile.png" // 👈 replace with your avatar later
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-40 bg-white border rounded-lg shadow-lg py-2">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
