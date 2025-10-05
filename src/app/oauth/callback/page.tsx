"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { parseTokensFromLocation, stripTokensFromUrl } from "@/api/oauth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const tokens = parseTokensFromLocation(window.location);

    // You can adjust these guards to match your backend's exact return shape
    if (tokens?.access_token) {
      // Build the object your AuthContext.login expects
      // (it accepts { access_token, refresh_token, user_name, roles, email })
      login({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? "",
        user_name: tokens.user_name ?? "",
        email: tokens.email ?? "",
        roles: tokens.role ?? "Student", // normalize to your app's shape
      });

      // Clean sensitive tokens from the url
      stripTokensFromUrl();

      // Go wherever you want after a successful OAuth login
      router.replace("/"); // or "/profile"
    } else {
      // No tokens found, go to /login
      router.replace("/login");
    }
  }, [login, router]);

  return (
    <div className="flex h-screen items-center justify-center text-gray-600">
      Finalizing sign-in…
    </div>
  );
}
