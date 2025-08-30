"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/api/register";

export default function RegisterPage() {
  const router = useRouter();

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
        role: "Professor",
      };

      await registerUser(payload);

      // redirect to login after success
      router.push("/login");
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
            <h1 className="text-3xl font-poppings text-midgreen uppercase tracking-wide">
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
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
              />
              <input
                type="text"
                name="last_name"
                placeholder="Lastname"
                value={form.last_name}
                onChange={handleChange}
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
              />
            </div>

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
            />

            {/* Username */}
            <input
              type="text"
              name="user_name"
              placeholder="Username"
              value={form.user_name}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
            />

            {/* Password */}
            <div className="flex gap-4">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
              />
              <input
                type="password"
                name="confirm_password"
                placeholder="Confirm password"
                value={form.confirm_password}
                onChange={handleChange}
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-midgreen py-3 text-white font-semibold hover:bg-midgreen transition disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </form>

          {/* Error messages */}
          {error && <p className="mt-3 text-red-500 text-center">{error}</p>}

          {/* Login link */}
          <p className="mt-4 text-sm text-gray-600 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-midgreen font-medium hover:underline">
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
