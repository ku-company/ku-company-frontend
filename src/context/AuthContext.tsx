"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AuthUser = {
  user_name: string;
  email: string;
  role: string;
};

type LoginData = {
  access_token: string;
  refresh_token: string;
  user_name: string;
  roles: string;
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

  // 🚀 Rehydrate from localStorage OR capture tokens from query params
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const access_token = url.searchParams.get("access_token");
      const refresh_token = url.searchParams.get("refresh_token");
      const user_name = url.searchParams.get("user_name");
      const email = url.searchParams.get("email");
      const roles = url.searchParams.get("roles");

      if (access_token && refresh_token && user_name && email && roles) {
        // save them into localStorage
        login({ access_token, refresh_token, user_name, email, roles });
        // clean URL so query params disappear
        window.history.replaceState({}, document.title, "/");
      } else {
        // fallback: load from localStorage
        const token = localStorage.getItem("access_token");
        const stored_user_name = localStorage.getItem("user_name");
        const stored_email = localStorage.getItem("email");
        const stored_role = localStorage.getItem("role");
        if (token && stored_user_name && stored_email && stored_role) {
          setUser({
            user_name: stored_user_name,
            email: stored_email,
            role: stored_role,
          });
        }
      }
    } catch (err) {
      console.error("Auth rehydration error", err);
    }
  }, []);

  function login(data: LoginData) {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user_name", data.user_name);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.roles);

    setUser({
      user_name: data.user_name,
      email: data.email,
      role: data.roles,
    });
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
