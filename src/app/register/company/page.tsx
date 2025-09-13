"use client";

import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-5xl items-center justify-between bg-white p-10 rounded-2xl shadow-lg">
        
        {/* Register Form */}
        <div className="w-full md:w-1/2">
          <h2 className="text-2xl font-semibold text-midgreen-500 uppercase tracking-wide">
            Sign up for
          </h2>
          <h1 className="text-3xl font-bold text-black mb-6">KU-COMPANY</h1>

          <form className="space-y-4">
            {/* Company Name */}
            <input
              type="text"
              placeholder="Company Name"
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
            />

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
            />

            {/* Username */}
            <input
              type="text"
              placeholder="Username"
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
            />

            {/* Password */}
            <div className="flex gap-4">
              <input
                type="password"
                placeholder="Password"
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
              />
              <input
                type="password"
                placeholder="Confirm password"
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-full bg-midgreen-500 py-3 text-white font-semibold hover:bg-midgreen-500 transition"
            >
              Sign up
            </button>
          </form>

          {/* Login link */}
          <p className="mt-4 text-sm text-gray-600">
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
    </div>
  );
}
