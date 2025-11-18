"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { logoutServerSession } from "@/api/logout";
import { ensureTokensFromCookies } from "@/lib/tokens";

type AuthUser = {
  id?: number | null;
  user_name: string;
  email: string;
  role: string;
  access_token: string;
  refresh_token?: string;
};

type LoginData = {
  access_token: string;
  refresh_token: string;
  user_name: string;
  email: string;
  roles?: string;
  role?: string;
  id?: number | string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  isReady: boolean;
  login: (data: LoginData) => void;
  logout: () => Promise<void>;
  setLocalRole: (role: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(r?: string | null): string {
  const raw = (r ?? "").trim().toLowerCase();
  if (raw.includes("company")) return "company";
  if (raw.includes("student")) return "student";
  if (raw.includes("professor")) return "professor";
  return raw;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const expTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const ensured = ensureTokensFromCookies();
    const token = ensured.access_token ?? null;
    const user_name = localStorage.getItem("user_name") ?? "";
    const email = localStorage.getItem("email") ?? "";
    const role = localStorage.getItem("role") ?? "";
    const idRaw = localStorage.getItem("user_id");
    const id = idRaw ? Number(idRaw) : null;

    // Consider user authenticated if an access token exists; fill other fields if present
    if (token) {
      setUser({ id, user_name, email, role: normalizeRole(role), access_token: token });
    }
    setIsReady(true);
  }, []);

  // Auto-logout on JWT expiry or 15 minutes after login (hard cap)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function decodeExp(t?: string | null): number | null {
      if (!t) return null;
      try {
        const base64 = t.split('.')[1];
        if (!base64) return null;
        const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(json);
        return typeof payload?.exp === 'number' ? payload.exp : null;
      } catch { return null; }
    }

    // Clear any previous timer
    if (expTimerRef.current) {
      window.clearTimeout(expTimerRef.current);
      expTimerRef.current = null;
    }

    const token = localStorage.getItem('access_token');
    const expSec = decodeExp(token);
    const now = Date.now();
    const fifteenMinMs = 15 * 60 * 1000;
    const expMs = expSec ? expSec * 1000 : now + fifteenMinMs;

    // If exp appears later than 15 minutes, still enforce 15 minutes cap
    const fireAt = Math.min(expMs, now + fifteenMinMs);
    const delay = Math.max(0, fireAt - now);

    expTimerRef.current = window.setTimeout(async () => {
      try {
        const { autoLogout, shouldDeferAutoLogout } = await import("@/utils/httpError");
        if (!shouldDeferAutoLogout()) autoLogout();
      } catch {}
    }, delay) as unknown as number;

    return () => {
      if (expTimerRef.current) {
        window.clearTimeout(expTimerRef.current);
        expTimerRef.current = null;
      }
    };
  }, [user?.access_token]);

  function login(data: LoginData) {
    const role = normalizeRole(data.roles ?? data.role ?? "");
    localStorage.setItem("access_token", data.access_token ?? "");
    localStorage.setItem("refresh_token", data.refresh_token ?? "");
    localStorage.setItem("user_name", data.user_name ?? "");
    localStorage.setItem("email", data.email ?? "");
    localStorage.setItem("role", role);
    if (data.id !== undefined && data.id !== null) {
      localStorage.setItem("user_id", String(data.id));
    }
    const fallbackId =
      typeof window !== "undefined" ? localStorage.getItem("user_id") : null;

    setUser({
      id:
        data.id !== undefined && data.id !== null
          ? Number(data.id)
          : fallbackId
          ? Number(fallbackId)
          : undefined,
      user_name: data.user_name ?? "",
      email: data.email ?? "",
      role,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
  }

  async function logout() {
    try {
      await logoutServerSession();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.clear();
      setUser(null);
      if (typeof window !== "undefined") {
        const path = window.location?.pathname || "";
        if (!path.startsWith("/login")) window.location.href = "/login";
      }
    }
  }

  function setLocalRole(role: string) {
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        role: normalizeRole(role),
      };
    });
  }

  return (
    <AuthContext.Provider value={{ user, isReady, login, logout, setLocalRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

