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
  const first = raw.split(/[,\s]+/).filter(Boolean)[0] ?? "";
  if (first.includes("company")) return "Company";
  if (first.includes("student")) return "Student";
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "Unknown";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const access_token = localStorage.getItem("access_token");
      const refresh_token = localStorage.getItem("refresh_token");
      const user_name = localStorage.getItem("user_name");
      const email = localStorage.getItem("email");
      const roleStored = localStorage.getItem("role");
      const role = normalizeRole(roleStored);

      if (access_token && user_name && email) {
        const restoredUser: AuthUser = {
          user_name,
          email,
          role,
          access_token,
          refresh_token: refresh_token ?? "",
        };
        setUser(restoredUser);
        console.log("Restored user from localStorage:", restoredUser);
      } else {
        console.warn("No saved user found in localStorage.");
      }
    } catch (err) {
      console.error("Error restoring user:", err);
    } finally {
      setIsReady(true);
    }
  }, []);

  function login(data: LoginData) {
    const incomingRole = data.roles ?? data.role ?? "";
    const role = normalizeRole(incomingRole);

    localStorage.setItem("access_token", data.access_token ?? "");
    localStorage.setItem("refresh_token", data.refresh_token ?? "");
    localStorage.setItem("user_name", data.user_name ?? "");
    localStorage.setItem("email", data.email ?? "");
    localStorage.setItem("role", role ?? "");

    const newUser: AuthUser = {
      user_name: data.user_name ?? "",
      email: data.email ?? "",
      role,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };

    console.log("Login success. Saving to context:", newUser);
    setUser(newUser);
  }

  function logout() {
    console.log("Logging out...");
    logoutServerSession();
    localStorage.clear();
    setUser(null);
  }

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
