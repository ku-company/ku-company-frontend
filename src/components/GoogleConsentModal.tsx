"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { GoogleSignupRole } from "@/api/oauth";

type GoogleConsentModalProps = {
  isOpen: boolean;
  role: GoogleSignupRole;
  requireStudentId?: boolean;
  initialStudentId?: string;
  submitting?: boolean;
  externalError?: string | null;
  onCancel: () => void;
  onConfirm: (data: { studentId?: string }) => void;
};

export default function GoogleConsentModal({
  isOpen,
  role,
  requireStudentId = false,
  initialStudentId,
  submitting = false,
  externalError = null,
  onCancel,
  onConfirm,
}: GoogleConsentModalProps) {
  const [studentId, setStudentId] = useState(initialStudentId ?? "");
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStudentId(initialStudentId ?? "");
    setConsentChecked(false);
    setError(null);
  }, [isOpen, initialStudentId]);

  const roleLabel = useMemo(() => {
    if (role === "Company") return "company";
    if (role === "Professor") return "professor";
    return "student";
  }, [role]);

  if (!isOpen) return null;

  function handleConfirm() {
    if (submitting) return;

    if (!consentChecked) {
      setError("Please agree to the Terms before continuing.");
      return;
    }

    if (requireStudentId) {
      const trimmed = studentId.trim();
      if (!trimmed) {
        setError("Student ID is required for the Google signup flow.");
        return;
      }
      onConfirm({ studentId: trimmed });
      return;
    }

    onConfirm({});
  }

  const combinedError = error || externalError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Continue with Google
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          To complete your {roleLabel} signup we need your consent to the{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-midgreen-500 underline"
          >
            Terms of Service & Privacy Notice
          </Link>
          .
        </p>

        {requireStudentId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={submitting}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-midgreen-500 disabled:opacity-60"
              placeholder="e.g., 6601234567"
            />
            <p className="mt-1 text-xs text-gray-500">
              Required by KU to verify active enrollment when using Google signup.
            </p>
          </div>
        )}

        <label className="flex items-start gap-2 text-sm text-gray-700 mb-4">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            disabled={submitting}
            className="mt-1 h-4 w-4"
          />
          <span>
            I consent to KU-Company processing my data according to the Terms of Service,
            Privacy Notice, and PDPA/GDPR requirements.
          </span>
        </label>

        {combinedError && (
          <p className="mb-3 text-sm text-red-600">
            {combinedError}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-full bg-midgreen-500 px-5 py-2 text-sm font-semibold text-white hover:bg-midgreen-600 disabled:opacity-60"
          >
            {submitting ? "Processing..." : "Agree & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
