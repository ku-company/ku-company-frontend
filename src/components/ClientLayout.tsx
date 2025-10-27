"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProfessorNavbar from "@/components/ui/ProfessorNavbar"; // ✅ เพิ่มบรรทัดนี้
import { ApplyCartProvider } from "@/context/ApplyCartContext";
import RouteGuard from "@/components/RouteGuard";
import RoleBootstrap from "@/components/RoleBootstrap";
import { useAuth } from "@/context/AuthContext"; // ✅ เพิ่มเพื่ออ่าน role

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOAuth = pathname?.startsWith("/oauth");
  const { user } = useAuth(); // ✅ ดึงข้อมูลผู้ใช้จาก context
  const role = user?.role?.toLowerCase();

  return (
    <ApplyCartProvider>
      {/* ✅ เพิ่มเงื่อนไขว่า ถ้าเป็น professor ใช้ ProfessorNavbar */}
      {!isOAuth && (
        role === "professor" ? <ProfessorNavbar /> : <Navbar />
      )}

      {isOAuth ? (
        children
      ) : (
        <RouteGuard>
          <RoleBootstrap />
          {children}
        </RouteGuard>
      )}
    </ApplyCartProvider>
  );
}
