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
        try {
          const input = args[0] as any;
          const init = (args[1] || {}) as RequestInit;
          const url = typeof input === "string" ? input : (input?.url ?? "");
          const method = (init.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
          if (url.includes("/api/professor/my-profile") && method === "POST") {
            // Normalize headers to a plain object for visibility
            const hdrs: Record<string, string> = {};
            const headersIn = (init.headers || (typeof input !== "string" ? (input?.headers as any) : undefined)) as any;
            if (headersIn) {
              if (headersIn instanceof Headers) {
                headersIn.forEach((v, k) => (hdrs[k] = v));
              } else if (Array.isArray(headersIn)) {
                for (const [k, v] of headersIn as any) hdrs[String(k)] = String(v);
              } else if (typeof headersIn === "object") {
                Object.keys(headersIn).forEach((k) => (hdrs[k] = (headersIn as any)[k]));
              }
            }
            const bodyPreview = typeof init.body === "string" ? init.body : "<non-string body>";
            console.log("[AUTH WRAP][REQUEST]", {
              url,
              method,
              headers: hdrs,
              body: bodyPreview,
            });
          }
        } catch {}

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

