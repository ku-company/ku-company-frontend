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
      const payload = {
        ...form,
        role: "Company",
      };

      await registerUser(payload);
      const res = await loginUser({
        user_name: form.user_name,
        password: form.password,
      });

      login(res.data);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7fff9] via-[#eef9f3] to-[#e3f6ea] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute w-72 h-72 bg-[#5b8f5b]/10 rounded-full blur-3xl top-[-5rem] left-[-6rem]" />
      <div className="absolute w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl bottom-[-6rem] right-[-8rem]" />

      {/* Card */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-10 bg-white/90 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl w-full max-w-5xl mx-auto p-10 md:p-14">
        {/* Left Side (Logo) */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 px-6">
          <img
            src="/logos/ku-company-logo.png"
            alt="KU Company Logo"
            className="w-72 h-72 object-contain drop-shadow-md"
          />
          <p className="text-gray-600 text-sm mt-3 italic">
            Join the network of innovation
          </p>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-1/2">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#5b8f5b] tracking-tight">
              Register Your Company
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Create your KU-Company profile today.
            </p>
          </div>

          <div className="card bg-white border border-emerald-100 shadow-md rounded-2xl">
            <form onSubmit={handleSubmit} className="card-body space-y-5">
              {/* Company Name */}
              <div className="relative">
                <input
                  type="text"
                  name="company_name"
                  placeholder=" "
                  value={form.company_name}
                  onChange={handleChange}
                  className="peer w-full rounded-xl border border-gray-200 bg-white/90 px-3 pt-5 pb-2 text-sm text-gray-800 shadow-sm focus:border-[#5b8f5b] focus:ring-2 focus:ring-[#5b8f5b]/40 focus:outline-none transition-all duration-200"
                />
                <label
                  htmlFor="company_name"
                  className="absolute left-3 top-2 text-gray-500 text-sm transition-all duration-200 
                    peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400
                    peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#5b8f5b]"
                >
                  Company Name
                </label>
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder=" "
                  value={form.email}
                  onChange={handleChange}
                  className="peer w-full rounded-xl border border-gray-200 bg-white/90 px-3 pt-5 pb-2 text-sm text-gray-800 shadow-sm focus:border-[#5b8f5b] focus:ring-2 focus:ring-[#5b8f5b]/40 focus:outline-none transition-all duration-200"
                />
                <label
                  htmlFor="email"
                  className="absolute left-3 top-2 text-gray-500 text-sm transition-all duration-200 
                    peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400
                    peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#5b8f5b]"
                >
                  Email
                </label>
              </div>

              {/* Username */}
              <div className="relative">
                <input
                  type="text"
                  name="user_name"
                  placeholder=" "
                  value={form.user_name}
                  onChange={handleChange}
                  className="peer w-full rounded-xl border border-gray-200 bg-white/90 px-3 pt-5 pb-2 text-sm text-gray-800 shadow-sm focus:border-[#5b8f5b] focus:ring-2 focus:ring-[#5b8f5b]/40 focus:outline-none transition-all duration-200"
                />
                <label
                  htmlFor="user_name"
                  className="absolute left-3 top-2 text-gray-500 text-sm transition-all duration-200 
                    peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400
                    peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#5b8f5b]"
                >
                  Username
                </label>
              </div>

              {/* Passwords */}
              <div className="flex gap-4">
                <div className="relative w-1/2">
                  <input
                    type="password"
                    name="password"
                    placeholder=" "
                    value={form.password}
                    onChange={handleChange}
                    className="peer w-full rounded-xl border border-gray-200 bg-white/90 px-3 pt-5 pb-2 text-sm text-gray-800 shadow-sm focus:border-[#5b8f5b] focus:ring-2 focus:ring-[#5b8f5b]/40 focus:outline-none transition-all duration-200"
                  />
                  <label
                    htmlFor="password"
                    className="absolute left-3 top-2 text-gray-500 text-sm transition-all duration-200 
                      peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400
                      peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#5b8f5b]"
                  >
                    Password
                  </label>
                </div>

                <div className="relative w-1/2">
                  <input
                    type="password"
                    name="confirm_password"
                    placeholder=" "
                    value={form.confirm_password}
                    onChange={handleChange}
                    className="peer w-full rounded-xl border border-gray-200 bg-white/90 px-3 pt-5 pb-2 text-sm text-gray-800 shadow-sm focus:border-[#5b8f5b] focus:ring-2 focus:ring-[#5b8f5b]/40 focus:outline-none transition-all duration-200"
                  />
                  <label
                    htmlFor="confirm_password"
                    className="absolute left-3 top-2 text-gray-500 text-sm transition-all duration-200 
                      peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400
                      peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#5b8f5b]"
                  >
                    Confirm Password
                  </label>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="text-center text-sm text-red-500 font-medium">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <button
                type="submit"
                disabled={loading}
                className="btn bg-[#5b8f5b] hover:bg-emerald-700 text-white rounded-full w-full font-semibold tracking-wide mt-2"
              >
                {loading ? "Signing up..." : "Sign up"}
              </button>

              <div className="divider text-xs text-gray-400">OR</div>

              <button
                type="button"
                onClick={() =>
                  (window.location.href = buildGoogleSignupUrl("Company"))
                }
                className="btn btn-outline border-gray-300 hover:border-black text-gray-700 hover:bg-gray-100 rounded-full w-full flex items-center justify-center gap-2"
              >
                <img
                  src="/logos/google.png"
                  alt="Google Logo"
                  className="w-5 h-5"
                />
                <span>Continue with Google</span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-5 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#5b8f5b] font-medium hover:underline"
            >
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
