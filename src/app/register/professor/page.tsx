"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/api/register";
import { loginUser } from "@/api/login";
import { useAuth } from "@/context/AuthContext";
import { buildGoogleSignupUrl } from "@/api/oauth";
import ProfessorOnboardingModal from "@/components/ProfessorOnboardingModal";
import notify from "@/lib/toast";
import { toast } from "react-toastify";
import LoadingOverlay from "@/components/LoadingOverlay";

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!acceptedTerms) {
        setLoading(false);
        toast.error("Please agree to the Terms before signing up.");
        setError("You must agree to the Terms before signing up.");
        return;
      }
      const payload = {
        ...form,
        role: "Professor",
        pdpa_consent: acceptedTerms,
      };

      const flow = async () => {
        await registerUser(payload);
        const res = await loginUser({ user_name: form.user_name, password: form.password });
        login(res.data);
      };

      await toast.promise(flow(), {
        pending: "Creating your account…",
        success: "Welcome!",
        error: {
          render({ data }) {
            const err = data as any;
            return (err?.message as string) || "Sign up failed";
          },
        },
      });

      // Show onboarding to collect faculty/department and create profile
      setShowOnboarding(true);
      notify.success("Registration complete");
      router.push("/");
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.message || "Something went wrong");
      // toast.promise above already shows an error toast; no duplicate here
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      {loading && (
        <LoadingOverlay
          title="Screening your account…"
          subtitle="Please wait while our AI completes the screening."
        />
      )}
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

            {/* Terms of Service consent */}
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                I have read and agree to the
                {" "}
                <Link
                  href="/terms"
                  className="text-midgreen-500 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service & Privacy (PDPA/GDPR)
                </Link>
                .
              </span>
            </label>

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
                if (!acceptedTerms) {
                  toast.error("Please agree to the Terms before continuing with Google.");
                  setError("You must agree to the Terms before continuing with Google.");
                  return;
                }
                // Kick off Google signup for Professor
                window.location.href = buildGoogleSignupUrl("Professor");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-black py-3 text-white font-semibold hover:bg-gray-800 transition"
            >
              <img src="/logos/google.png" alt="Google Logo" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Errors are surfaced via toast notifications */}

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
