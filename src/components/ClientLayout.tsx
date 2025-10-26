"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ApplyCartProvider } from "@/context/ApplyCartContext";
import RouteGuard from "@/components/RouteGuard";
import RoleBootstrap from "@/components/RoleBootstrap";
import ProfessorOnboardingBootstrap from "@/components/auth/ProfessorOnboardingBootstrap";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOAuth = pathname?.startsWith("/oauth");

  return (
    <ApplyCartProvider>
      {!isOAuth && <Navbar />}
      {isOAuth ? children : (
        <RouteGuard>
          <RoleBootstrap />
          {/* If user is a Professor and has no profile yet, prompt creation */}
          <ProfessorOnboardingBootstrap />
          {children}
        </RouteGuard>
      )}
    </ApplyCartProvider>
  );
}
