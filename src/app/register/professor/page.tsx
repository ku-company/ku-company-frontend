"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/api/register";
import { loginUser } from "@/api/login";          // <-- add
import { useAuth } from "@/context/AuthContext";  // <-- add

export default function RegisterCompanyPage() {
  const router = useRouter();
  const { login } = useAuth(); // <-- get auth login

  const [form, setForm] = useState({
    company_name: "",
    email: "",
    user_name: "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password !== form.confirm_password) {
      setLoading(false);
      setError("Passwords do not match");
      return;
    }

    try {
      // 1) Register as Company (company_name instead of first/last)
      const payload = {
        company_name: form.company_name,
        email: form.email,
        user_name: form.user_name,
        password: form.password,
        confirm_password: form.confirm_password,
        role: "Company",
      };
      await registerUser(payload);

      // 2) Immediately login (auto-login behavior)
      const res = await loginUser({
        user_name: form.user_name,
        password: form.password,
      });

      // 3) Persist tokens + user in AuthContext
      //    login expects: { access_token, refresh_token, user_name, roles, email }
      login(res.data);

      // 4) Go to the same place as student after auto-login
      router.push("/"); // or "/company/home" if you prefer
    } catch (err: any) {
      console.error("Company registration/login failed:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="flex w-full max-w-5xl items-center justify-between bg-white p-10">
        {/* Register Form */}
        <div className="w-full md:w-1/2">
          <div className="text-center">
            <h1 className="text-3xl font-poppings text-midgreen-500 uppercase tracking-wide">
              Sign up for
            </h1>
            <h1 className="mb-6 text-4xl font-poppings text-black">
              KU-COMPANY
            </h1>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Company Name */}
            <input
              type="text"
              name="company_name"
              placeholder="Company name"
              value={form.company_name}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
            />

            {/* Username */}
            <input
              type="text"
              name="user_name"
              placeholder="Username"
              value={form.user_name}
              onChange={handleChange}
              className="w/full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
            />

            {/* Passwords */}
            <div className="flex gap-4">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
              />
              <input
                type="password"
                name="confirm_password"
                placeholder="Confirm password"
                value={form.confirm_password}
                onChange={handleChange}
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-midgreen-500 py-3 text-white font-semibold transition hover:bg-midgreen-500 disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-full bg-black py-3 text-white font-semibold hover:bg-gray-800 transition"
            >
              <img src="/logos/google.png" alt="Google Logo" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
          </form>

          {error && <p className="mt-3 text-center text-red-500">{error}</p>}

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-midgreen-500 font-medium hover:underline">
              Log in here
            </Link>
          </p>
        </div>

        <div className="hidden md:flex w-1/2 items-center justify-center">
          <img
            src="/logos/ku-company-logo.png"
            alt="KU-Company Logo"
            className="max-w-xs"
          />
        </div>
      </div>
    </div>
  );
}
