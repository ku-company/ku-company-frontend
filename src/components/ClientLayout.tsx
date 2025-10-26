"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ApplyCartProvider } from "@/context/ApplyCartContext";
import RouteGuard from "@/components/RouteGuard";
import RoleBootstrap from "@/components/RoleBootstrap";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOAuth = pathname?.startsWith("/oauth");

  return (
    <ApplyCartProvider>
      {!isOAuth && <Navbar />}
      {isOAuth ? children : (
        <RouteGuard>
          <RoleBootstrap />
          {children}
        </RouteGuard>
      )}
    </ApplyCartProvider>
  );
}
