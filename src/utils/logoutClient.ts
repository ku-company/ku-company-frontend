"use client";

import { logoutServerSession } from "@/api/logout";

export const LOGOUT_EVENT = "ku-company:logout";

export function clearClientSessionStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.clear();
  } catch (err) {
    console.warn("Failed to clear localStorage during logout:", err);
  }
  try {
    window.sessionStorage.clear();
  } catch (err) {
    console.warn("Failed to clear sessionStorage during logout:", err);
  }
  try {
    window.dispatchEvent(new Event(LOGOUT_EVENT));
  } catch {
    /* ignore */
  }
}

type LogoutOptions = {
  redirectToLogin?: boolean;
};

export async function logoutAndClear(options: LogoutOptions = {}): Promise<void> {
  const { redirectToLogin = false } = options;
  try {
    await logoutServerSession();
  } catch (err) {
    console.error("Logout request failed:", err);
  } finally {
    clearClientSessionStorage();
    if (redirectToLogin && typeof window !== "undefined") {
      const path = window.location?.pathname || "";
      if (!path.startsWith("/login")) {
        window.location.href = "/login";
      } else {
        window.location.reload();
      }
    }
  }
}
