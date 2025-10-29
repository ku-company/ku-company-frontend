"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/api/register";
import { loginUser } from "@/api/login";
import { useAuth } from "@/context/AuthContext";
import { buildGoogleSignupUrl } from "@/api/oauth";

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
        role: "Student",
      };

      await registerUser(payload);

      // Auto login immediately after successful registration
      const res = await loginUser({
        user_name: form.user_name,
        password: form.password,
      });
      login(res.data);

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
    <div className="hero min-h-[calc(100vh-56px)] bg-base-200 px-4">
      <div className="flex w-full max-w-5xl items-center justify-between p-6 sm:p-10">
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
                className="input input-bordered w-1/2"
              />
              <input
                type="text"
                name="last_name"
                placeholder="Lastname"
                value={form.last_name}
                onChange={handleChange}
                className="input input-bordered w-1/2"
              />
            </div>

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="input input-bordered w-full"
            />

            {/* Username */}
            <input
              type="text"
              name="user_name"
              placeholder="Username"
              value={form.user_name}
              onChange={handleChange}
              className="input input-bordered w-full"
            />

            {/* Password */}
            <div className="flex gap-4">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="input input-bordered w-1/2"
              />
              <input
                type="password"
                name="confirm_password"
                placeholder="Confirm password"
                value={form.confirm_password}
                onChange={handleChange}
                className="input input-bordered w-1/2"
              />
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn btn-primary w-full rounded-full text-white">
              {loading ? "Signing up..." : "Sign up"}
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = buildGoogleSignupUrl("Student"); }}
              className="btn btn-neutral w-full rounded-full"
            >
              <img src="/logos/google.png" alt="Google Logo" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Error messages */}
          {error && <p className="mt-3 text-red-500 text-center">{error}</p>}

          {/* Login link */}
          <p className="mt-4 text-sm opacity-70 text-center">
            Already have an account?{" "}
            <Link href="/login" className="link link-primary">
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
    </div>
  );
}
