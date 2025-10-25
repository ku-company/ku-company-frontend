"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import CompanyNavbar from "@/components/CompanyNavbar";
import BootstrapSession from "@/components/auth/BootstrapSession";
import { AuthProvider } from "@/context/AuthContext";

function LayoutWithAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  // While waiting for BootstrapSession to fetch user data
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  const role = user?.roles?.toString().toLowerCase().trim() ?? "";
  const isCompany = role === "company";

  // Optionally, limit CompanyNavbar only for /company routes
  const isCompanyRoute = pathname.startsWith("/company");
  const showCompanyNavbar = isCompany && isCompanyRoute;

  return (
    <>
      {showCompanyNavbar ? <CompanyNavbar /> : <Navbar />}
      <main className="mt-20 min-h-screen">{children}</main>
    </>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BootstrapSession />
      <LayoutWithAuth>{children}</LayoutWithAuth>
    </AuthProvider>
  );
}
