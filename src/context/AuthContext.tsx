"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { logoutServerSession } from "@/api/logout";

type AuthUser = { user_name: string; email: string; role: string };

type LoginData = {
  access_token: string;
  refresh_token: string;
  user_name: string;
  email: string;
  roles?: string; // may come as 'roles'
  role?: string;  // ...or as 'role'
};

type AuthContextType = {
  user: AuthUser | null;
  isReady: boolean;               // ✅ tells consumers hydration is done
  login: (data: LoginData) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(r?: string | null): string {
  const raw = (r ?? "").trim().toLowerCase();
  // support comma/space-delimited roles, pick the first
  const first = raw.split(/[,\s]+/).filter(Boolean)[0] ?? "";
  if (first.includes("company")) return "Company";
  if (first.includes("student")) return "Student";
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mark mounted ASAP to avoid SSR/CSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Rehydrate from localStorage on client
  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      const user_name = localStorage.getItem("user_name");
      const email = localStorage.getItem("email");
      const roleStored = localStorage.getItem("role");
      const role = normalizeRole(roleStored);
      if (token && user_name && email && role) {
        setUser({ user_name, email, role });
      }
    } finally {
      // Signal that initial auth check is completed
      setIsReady(true);
    }
  }, []);

  function login(data: LoginData) {
    const incomingRole = data.roles ?? data.role ?? "";
    const role = normalizeRole(incomingRole);

    // Persist
    localStorage.setItem("access_token", data.access_token ?? "");
    localStorage.setItem("refresh_token", data.refresh_token ?? "");
    localStorage.setItem("user_name", data.user_name ?? "");
    localStorage.setItem("email", data.email ?? "");
    localStorage.setItem("role", role ?? "");

    // Update state
    setUser({ user_name: data.user_name ?? "", email: data.email ?? "", role: role ?? "" });
  }

  function logout() {
    // Clear server session cookie
    logoutServerSession();

    // Clear local state/storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setUser(null);
  }

  // Avoid rendering children on the server (prevents hydration mismatch)
  if (!mounted) return null;

  return (
    <AuthContext.Provider value={{ user, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
