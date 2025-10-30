"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/api/register";
import { loginUser } from "@/api/login";
import { useAuth } from "@/context/AuthContext";
import { buildGoogleSignupUrl } from "@/api/oauth";
import ProfessorOnboardingModal from "@/components/ProfessorOnboardingModal";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    user_name: "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...form,
        role: "Professor",
      };

      await registerUser(payload);

      // Immediately log in to get token for profile creation
      const res = await loginUser({ user_name: form.user_name, password: form.password });
      login(res.data);

      // Show onboarding to collect faculty/department and create profile
      setShowOnboarding(true);

      // Redirect to home
      router.push("/");
    } catch (err: any) {
      console.error("Registration failed:", err);
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
            <h1 className="text-4xl font-poppings text-black mb-6">
              KU-COMPANY
            </h1>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* First and Lastname */}
            <div className="flex gap-4">
              <input
                type="text"
                name="first_name"
                placeholder="Firstname"
                value={form.first_name}
                onChange={handleChange}
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
              />
              <input
                type="text"
                name="last_name"
                placeholder="Lastname"
                value={form.last_name}
                onChange={handleChange}
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
              />
            </div>

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

            {/* Password */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-midgreen-500 py-3 text-white font-semibold hover:bg-midgreen-500 transition disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
            <button
              type="button"
              onClick={() => {
                // Kick off Google signup for Professor
                window.location.href = buildGoogleSignupUrl("Professor");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-black py-3 text-white font-semibold hover:bg-gray-800 transition"
            >
              <img src="/logos/google.png" alt="Google Logo" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Error messages */}
          {error && <p className="mt-3 text-red-500 text-center">{error}</p>}

          {/* Login link */}
          <p className="mt-4 text-sm text-gray-600 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-midgreen-500 font-medium hover:underline">
              Log in here
            </Link>
          </p>
        </div>

        {/* Logo */}
        <div className="hidden md:flex w-1/2 items-center justify-center">
          <img
            src="/logos/ku-company-logo.png"
            alt="KU-Company Logo"
            className="max-w-xs"
          />
        </div>
      </div>

      <ProfessorOnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          // After closing (saved or not), move to home; they can edit later
          router.push("/");
        }}
        onCreated={() => {
          // After profile creation, route to home
          router.push("/");
        }}
      />
    </div>
  );
}
