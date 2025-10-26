"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RoleSelectModal from "@/components/roleselector";
import { loginUser } from "@/api/login";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
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
      const res = await loginUser(form);
      login(res.data);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.location.href = "http://localhost:8000/api/auth/google?role=";
  }

  return (
    <>
      {/* ───── Background ───── */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7fff9] via-[#eef9f3] to-[#e3f6ea] relative overflow-hidden">
        {/* Blurred Circles for soft feel */}
        <div className="absolute w-80 h-80 bg-[#5b8f5b]/10 rounded-full blur-3xl top-[-5rem] left-[-6rem]" />
        <div className="absolute w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl bottom-[-6rem] right-[-8rem]" />

        {/* ───── Login Card ───── */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between bg-white/90 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl w-full max-w-5xl mx-auto p-10 md:p-14">
          {/* Left side (Logo) */}
          <div className="hidden md:flex flex-col items-center justify-center w-1/2 px-6">
            <img
              src="/logos/ku-company-logo.png"
              alt="KU Company Logo"
              className="w-72 h-72 object-contain drop-shadow-md"
            />
            <p className="text-gray-600 text-sm mt-3 italic">
              Connecting Students & Companies
            </p>
          </div>

          {/* Right side (Login Form) */}
          <div className="w-full md:w-1/2">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#5b8f5b] tracking-tight">
                Welcome Back
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                Sign in to continue to{" "}
                <span className="font-semibold text-gray-800">KU-Company</span>
              </p>
            </div>

            {/* Card */}
            <div className="card bg-white border border-emerald-100 shadow-md rounded-2xl">
              <form onSubmit={handleSubmit} className="card-body space-y-5">
                
                {/* Username */}
                <div className="relative">
                  <input
                    type="text"
                    name="user_name"
                    value={form.user_name}
                    onChange={handleChange}
                    placeholder=" "
                    className="peer w-full rounded-xl border border-gray-200 bg-white/90 px-3 pt-5 pb-2 text-sm text-gray-800 shadow-sm transition-all duration-200 focus:border-[#5b8f5b] focus:ring-2 focus:ring-[#5b8f5b]/40 focus:outline-none"
                    autoComplete="username"
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

                {/* Password */}
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder=" "
                    className="peer w-full rounded-xl border border-gray-200 bg-white/90 px-3 pt-5 pb-2 text-sm text-gray-800 shadow-sm transition-all duration-200 focus:border-[#5b8f5b] focus:ring-2 focus:ring-[#5b8f5b]/40 focus:outline-none"
                    autoComplete="current-password"
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

                {/* Error message */}
                {error && (
                  <div className="text-center text-sm text-red-500 font-medium">
                    {error}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn bg-[#5b8f5b] hover:bg-emerald-700 text-white rounded-full w-full font-semibold tracking-wide mt-2"
                >
                  {loading ? "Logging in..." : "Log in"}
                </button>

                <div className="divider text-xs text-gray-400">OR</div>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogle}
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

            {/* Footer links */}
            <div className="mt-4 flex justify-between text-sm text-gray-500">
              <a href="#" className="hover:text-[#5b8f5b] hover:underline">
                Forgot Password?
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[#5b8f5b] font-medium hover:underline"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Role Select Modal ───── */}
      <RoleSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
