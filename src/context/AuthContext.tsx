"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { logoutServerSession } from "@/api/logout";

type AuthUser = {
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
};

type AuthContextType = {
  user: AuthUser | null;
  isReady: boolean;
  login: (data: LoginData) => void;
  logout: () => void;
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

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const user_name = localStorage.getItem("user_name") ?? "";
    const email = localStorage.getItem("email") ?? "";
    const role = localStorage.getItem("role") ?? "";

    // Consider user authenticated if an access token exists; fill other fields if present
    if (token) {
      setUser({ user_name, email, role: normalizeRole(role), access_token: token });
    }
    setIsReady(true);
  }, []);

  function login(data: LoginData) {
    const role = normalizeRole(data.roles ?? data.role ?? "");
    localStorage.setItem("access_token", data.access_token ?? "");
    localStorage.setItem("refresh_token", data.refresh_token ?? "");
    localStorage.setItem("user_name", data.user_name ?? "");
    localStorage.setItem("email", data.email ?? "");
    localStorage.setItem("role", role);
    setUser({
      user_name: data.user_name ?? "",
      email: data.email ?? "",
      role,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
  }

  function logout() {
    logoutServerSession();
    localStorage.clear();
    setUser(null);
  }

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

