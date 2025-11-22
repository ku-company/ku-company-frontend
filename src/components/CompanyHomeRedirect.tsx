"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CompanyHomeRedirect() {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const role = (user?.role || "").toLowerCase();

  useEffect(() => {
    if (!isReady) return;
    if (role.includes("company")) {
      router.replace("/company/home");
    }
  }, [isReady, role, router]);

  return null;
}
