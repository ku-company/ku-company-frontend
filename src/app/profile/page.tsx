// src/app/profile/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentProfileView from "@/components/profile/StudentProfileView";
import CompanyProfileView from "@/components/profile/CompanyProfileView";

export default function ProfilePage() {
  const { user, isReady } = useAuth();  // 👈 read isReady
  const router = useRouter();

  // Only consider redirecting AFTER hydration
  useEffect(() => {
    if (isReady && !user) {
      console.log("🔴 No user after hydration, redirecting to /login");
      router.replace("/login"); // replace to avoid back button loop
    }
  }, [isReady, user, router]);

  // While hydrating, show nothing or a small loader
  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading profile…
      </div>
    );
  }

  // After hydration: if no user, we already redirected
  if (!user) return null;

  console.log("👤 Logged-in user:", user);
  console.log("🧩 Role from AuthContext:", user.role);

  const role = (user.role || "").toLowerCase();
  if (role === "company") {
    console.log("✅ Detected company role — showing CompanyProfileView");
    return <CompanyProfileView />;
  }

  console.log("✅ Detected student role — showing StudentProfileView");
  return <StudentProfileView />;
}
