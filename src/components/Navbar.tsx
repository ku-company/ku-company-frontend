"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-semibold tracking-widest">
          KU‑COMPANY
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

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-xs px-3 py-1 rounded border">
            LOGIN
          </Link>
          <Link href="/register" className="text-xs px-3 py-1 rounded border">
            SIGNUP
          </Link>
        </div>
      </div>
    </header>
  );
}
