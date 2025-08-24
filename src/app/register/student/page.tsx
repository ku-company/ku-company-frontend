"use client";

import Link from "next/link";

export default function RegisterPage() {

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

          <form className="space-y-4">
            {/* First and Lastname */}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Firstname"
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
              />
              <input
                type="text"
                placeholder="Lastname"
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
              />
            </div>

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
            />

            {/* Username */}
            <input
              type="text"
              placeholder="Username"
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
            />

            {/* Password */}
            <div className="flex gap-4">
              <input
                type="password"
                placeholder="Password"
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
              />
              <input
                type="password"
                placeholder="Confirm password"
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-full bg-midgreen py-3 text-white font-semibold hover:bg-midgreen transition"
            >
              Sign up
            </button>
          </form>

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
