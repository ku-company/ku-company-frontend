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
      // 🚀 Update global auth state + localStorage in one go
      login(res.data);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex w-full max-w-4xl items-center justify-between p-8">
          {/* Left logo */}
          <div className="hidden w-1/2 md:flex items-center justify-center ml-[-7em]">
            <div className="w-96 h-96 flex items-center justify-center">
              <img
                src="/logos/ku-company-logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Login form */}
          <div className="w-full md:w-1/2 max-w-md">
            <div className="flex items-center justify-center flex-col mb-5">
              <h2 className="text-4xl font-poppings text-midgreen">WELCOME BACK TO</h2>
              <h1 className="text-4xl font-poppings text-black">KU-COMPANY</h1>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="text"
                name="user_name"
                value={form.user_name}
                onChange={handleChange}
                placeholder="Username"
                className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
                autoComplete="username"
              />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
                autoComplete="current-password"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-midgreen py-2 text-white font-semibold hover:bg-green-800 transition disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-full bg-black py-2 text-white font-semibold hover:bg-gray-800 transition"
              >
                <img src="/logos/google.png" alt="Google Logo" className="w-5 h-5" />
                <span>Log in with Google</span>
              </button>
            </form>

            {error && <p className="mt-3 text-red-500 text-center">{error}</p>}

            <div className="mt-4 flex justify-between text-sm">
              <a href="#" className="text-gray-500 hover:underline">
                Forgot Password?
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-midgreen font-medium hover:underline"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <RoleSelectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
