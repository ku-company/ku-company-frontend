"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/api/register";
import { loginUser } from "@/api/login";          
import { useAuth } from "@/context/AuthContext";  
import { buildGoogleSignupUrl } from "@/api/oauth";
import notify from "@/lib/toast";
import { toast } from "react-toastify";
import LoadingOverlay from "@/components/LoadingOverlay";
import GoogleConsentModal from "@/components/GoogleConsentModal";

const MIN_PASSWORD_LENGTH = 8;

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setLoading(false);
      const msg = "Password must be at least 8 characters.";
      toast.error(msg);
      setError(msg);
      return;
    }

    if (form.password !== form.confirm_password) {
      setLoading(false);
      toast.error("Passwords do not match");
      setError("Passwords do not match");
      return;
    }

    try {
      if (!acceptedTerms) {
        setLoading(false);
        toast.error("Please agree to the Terms before signing up.");
        setError("You must agree to the Terms before signing up.");
        return;
      }
      // Register company account
      const payload = {
        company_name: form.company_name,
        email: form.email,
        user_name: form.user_name,
        password: form.password,
        confirm_password: form.confirm_password,
        role: "Company",
        pdpa_consent: acceptedTerms,
      };

      const flow = async () => {
        await registerUser(payload);
        const res = await loginUser({ user_name: form.user_name, password: form.password });
        login(res.data);
      };

      await toast.promise(flow(), {
        pending: "Creating company account…",
        success: "Company registered",
        error: {
          render({ data }) {
            const err = data as any;
            return (err?.message as string) || "Sign up failed";
          },
        },
      });

      // Create default company profile
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          const profileRes = await fetch("http://localhost:8000/api/company/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              company_name: form.company_name || form.user_name,
              description: "To be Added",
              industry: "To be Added",
              tel: "To be Added",
              location: "To be Added",
            }),
          });

          if (!profileRes.ok) {
            const text = await profileRes.text();
            console.error("Failed to create default profile:", text);
          } else {
            console.log("Default company profile created successfully");
          }
        } else {
          console.warn("No token found — skipping company profile creation");
        }
      } catch (profileErr) {
        console.error("Company profile creation error:", profileErr);
      }

      // Mark that onboarding should be shown immediately after redirect
      try {
        localStorage.setItem("needs_company_onboarding", "1");
      } catch {}

      // Redirect home after everything succeeds
      notify.success("Registration complete");
      router.push("/");
    } catch (err: any) {
      console.error("Company registration/login failed:", err);
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
          title="Screening company account…"
          subtitle="Please wait while we verify your account."
        />
      )}
      <div className="flex w-full max-w-5xl items-center justify-between bg-white p-10">
        {/* Register Form */}
        <div className="w-full md:w-1/2">
          <div className="text-center">
            <h1 className="text-3xl font-poppings text-midgreen-500 uppercase tracking-wide">
              Sign up for
            </h1>
            <h1 className="mb-6 text-4xl font-poppings text-black">
              KU-COMPANY
            </h1>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Company Name */}
            <input
              type="text"
              name="company_name"
              placeholder="Company name"
              value={form.company_name}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
            />

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

            {/* Passwords */}
            <div className="flex gap-4">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                minLength={MIN_PASSWORD_LENGTH}
                className="w-1/2 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500"
              />
              <input
                type="password"
                name="confirm_password"
                placeholder="Confirm password"
                value={form.confirm_password}
                onChange={handleChange}
                minLength={MIN_PASSWORD_LENGTH}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-midgreen-500 py-3 text-white font-semibold transition hover:bg-midgreen-500 disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-black py-3 text-white font-semibold hover:bg-gray-800 transition"
            >
              <img src="/logos/google.png" alt="Google Logo" className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Errors are surfaced via toast notifications */}

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-midgreen-500 font-medium hover:underline">
              Log in here
            </Link>
          </p>
        </div>

        <div className="hidden md:flex w-1/2 items-center justify-center">
          <img
            src="/logos/ku-company-logo.png"
            alt="KU-Company Logo"
            className="max-w-xs"
          />
        </div>
      </div>

      <GoogleConsentModal
        isOpen={showGoogleModal}
        role="Company"
        onCancel={() => setShowGoogleModal(false)}
        onConfirm={() => {
          setShowGoogleModal(false);
          try {
            localStorage.setItem("pending_oauth_signup_company", "1");
          } catch {}
          window.location.href = buildGoogleSignupUrl("Company", {
            consent: true,
            extraParams: { signup: "1" },
          });
        }}
      />
    </div>
  );
}
