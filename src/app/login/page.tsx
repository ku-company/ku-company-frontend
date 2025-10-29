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
      router.push("/"); // main page will now bootstrap the session
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    // Normal OAuth redirect (no query string)
    window.location.href = "http://localhost:8000/api/auth/google?role=";
  }

  return (
    <>
      <div className="hero min-h-[calc(100vh-56px)] bg-gradient-to-br from-midgreen-50 to-base-200">
        <div className="flex w-full max-w-4xl items-center justify-between p-4 sm:p-8">
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
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-center mb-2">
                  <h2 className="text-3xl font-bold text-primary">Welcome Back</h2>
                  <p className="opacity-70">Sign in to continue to KU-Company</p>
                </div>
                <form className="space-y-3" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    name="user_name"
                    value={form.user_name}
                    onChange={handleChange}
                    placeholder="Username"
                    className="input input-bordered w-full"
                    autoComplete="username"
                  />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="input input-bordered w-full"
                    autoComplete="current-password"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary rounded-full w-full text-white"
                  >
                    {loading ? "Logging in..." : "Log in"}
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogle}
                    className="btn btn-neutral rounded-full w-full"
                  >
                    <img src="/logos/google.png" alt="Google Logo" className="w-5 h-5" />
                    <span>Continue with Google</span>
                  </button>
                </form>
              </div>
            </div>

            {error && <p className="mt-3 text-red-500 text-center">{error}</p>}

            <div className="mt-4 flex justify-between text-sm">
              <a href="#" className="text-gray-500 hover:underline">
                Forgot Password?
              </a>
              <button onClick={() => setIsModalOpen(true)} className="link link-primary">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      <RoleSelectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
