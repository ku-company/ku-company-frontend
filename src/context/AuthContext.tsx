"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AuthUser = {
  user_name: string;
  email: string;
  role: string; // we store single "role" locally (mapped from response "roles")
};

type LoginData = {
  access_token: string;
  refresh_token: string;
  user_name: string;
  roles: string; // comes from backend as "roles"
  email: string;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (data: LoginData) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Rehydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      const user_name = localStorage.getItem("user_name");
      const email = localStorage.getItem("email");
      const role = localStorage.getItem("role");
      if (token && user_name && email && role) {
        setUser({ user_name, email, role });
      }
    } catch {
      // ignore
    }
  }, []);

  function login(data: LoginData) {
    // Persist
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user_name", data.user_name);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.roles);
    // Update state immediately
    setUser({ user_name: data.user_name, email: data.email, role: data.roles });
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
