"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { parseTokensFromLocation, stripTokensFromUrl } from "@/api/oauth";

export default function OAuthAutoLogin() {
  const { login } = useAuth();

  useEffect(() => {
    const tokens = parseTokensFromLocation(window.location);
    if (tokens?.access_token) {
      login({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? "",
        user_name: tokens.user_name ?? "",
        email: tokens.email ?? "",
        roles: tokens.role ?? "Student",
      });
      stripTokensFromUrl();
    }
  }, [login]);

  return null;
}
