"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginPromptModal from "@/components/LoginPromptModal";

// Public routes that do not require authentication
const PUBLIC_PATHS = new Set<string>([
  "/homepage",
  "/login",
  "/register",
  "/register/student",
  "/register/company",
  "/register/professor",
  "/oauth/callback",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Allow nested register routes
  if (pathname.startsWith("/register/")) return true;
  return false;
}

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // no redirect; show modal for unauthenticated protected routes
    if (!isReady) return;
  }, [isReady]);

  // While auth is hydrating, or redirecting an unauth user, don't render protected content
  if (!isReady) return null;
  const isPublic = isPublicPath(pathname);
  if (!user && !isPublic) {
    return <LoginPromptModal isOpen={true} />;
  }
  return <>{children}</>;
}
