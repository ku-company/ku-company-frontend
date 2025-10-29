"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/api/register";
import { loginUser } from "@/api/login";          
import { useAuth } from "@/context/AuthContext";  
import { buildGoogleSignupUrl } from "@/api/oauth";

export default function RegisterCompanyPage() {
  const router = useRouter();
  const { login } = useAuth(); 

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
      // Register company account
      const payload = {
        company_name: form.company_name,
        email: form.email,
        user_name: form.user_name,
        password: form.password,
        confirm_password: form.confirm_password,
        role: "Company",
      };

      await registerUser(payload);
      console.log("Company registered successfully");

      // Immediately log in to get token
      const res = await loginUser({
        user_name: form.user_name,
        password: form.password,
      });

      login(res.data);

      // Create default company profile
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          const profileRes = await fetch("http://localhost:8000/api/company/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              company_name: form.company_name || form.user_name,
              description: "To be Added",
              industry: "To be Added",
              tel: "To be Added",
              location: "To be Added",
            }),
          });

          if (!profileRes.ok) {
            const text = await profileRes.text();
            console.error("Failed to create default profile:", text);
          } else {
            console.log("Default company profile created successfully");
          }
        } else {
          console.warn("No token found — skipping company profile creation");
        }
      } catch (profileErr) {
        console.error("Company profile creation error:", profileErr);
      }

      // Mark that onboarding should be shown immediately after redirect
      try {
        localStorage.setItem("needs_company_onboarding", "1");
      } catch {}

      // Redirect home after everything succeeds
      router.push("/");
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
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
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
              onClick={() => {
                // Kick off Google signup for Company (mark as signup)
                try {
                  localStorage.setItem("pending_oauth_signup_company", "1");
                } catch {}
                window.location.href = buildGoogleSignupUrl("Company") + "&signup=1";
              }}
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
