"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentProfileView from "@/components/profile/StudentProfileView";
import CompanyProfileView from "@/components/profile/CompanyProfileView";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to login if no user
  useEffect(() => {
    if (!user) {
      console.log("🔴 No user found, redirecting to /login");
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  // ✅ Log full user object and role for debugging
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
