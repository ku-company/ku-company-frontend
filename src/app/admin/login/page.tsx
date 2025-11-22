"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/api/login";
import { useAuth } from "@/context/AuthContext";
import notify from "@/lib/toast";
import { toast } from "react-toastify";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ user_name: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await toast.promise(loginUser(form), {
        pending: "Signing in…",
        success: "Admin login successful",
        error: "Login failed",
      });
      const role = (res?.data?.roles || (res as any)?.data?.role || "").toString().toLowerCase();
      if (role !== "admin") {
        setError("This account is not an Admin.");
        return;
      }
      login(res.data);
      notify.success("Welcome, Admin");
      router.replace("/admin");
    } catch (err: any) {
      setError(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Admin Login</h1>
        <div className="mt-4 space-y-3">
          <input
            type="text"
            name="user_name"
            value={form.user_name}
            onChange={handleChange}
            placeholder="Username"
            className="w-full rounded-md border px-3 py-2 text-sm"
            autoComplete="username"
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full rounded-md border px-3 py-2 text-sm"
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading} className="w-full rounded-full bg-emerald-700 py-2 text-white text-sm disabled:opacity-50">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </form>
    </main>
  );
}

