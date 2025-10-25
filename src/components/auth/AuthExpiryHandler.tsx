"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { shouldDeferAutoLogout } from "@/utils/httpError";

// Custom event name used to broadcast auth expiry across app
export const AUTH_EXPIRED_EVENT = "auth:expired";

export default function AuthExpiryHandler() {
  const { logout } = useAuth();
  const router = useRouter();
  const installed = useRef(false);

  useEffect(() => {
    if (installed.current) return;
    installed.current = true;

    if (typeof window === "undefined") return;
    const w = window as any;

    // Wrap window.fetch once to detect JWT expiry responses globally
    if (!w.__authFetchWrapped) {
      const originalFetch = window.fetch.bind(window);
      w.__authFetchWrapped = true;
      w.__authFetchOriginal = originalFetch;

      window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
        const res = await originalFetch(...args);
        try {
          const status = res.status;
          const hasToken = !!localStorage.getItem("access_token");
          if (hasToken && (status === 401 || status === 403)) {
            if (shouldDeferAutoLogout()) return res;
            // Try to sniff message from body without consuming caller's stream
            const text = await res.clone().text().catch(() => "");
            const msg = (text || "").toLowerCase();
            if (
              msg.includes("jwt expired") ||
              msg.includes("token expired") ||
              msg.includes("expired token")
            ) {
              window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
            }
          }
        } catch {
          // no-op
        }
        return res;
      };
    }

    // When notified, clear auth and route to login
    const onExpired = () => {
      try { logout(); } catch {}
      try { router.replace("/login"); } catch {}
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [logout, router]);

  return null;
}

