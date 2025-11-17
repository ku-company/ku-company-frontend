"use client";

import { useEffect, useRef, useState } from "react";
import { createProfessorProfile } from "@/api/professorprofile";
import LoadingOverlay from "@/components/LoadingOverlay";
import { requestAiRegistrationReview } from "@/api/ai";
import { fetchAuthMe } from "@/api/session";
import { useAuth } from "@/context/AuthContext";
import notify from "@/lib/toast";
import { reloginAfterAiReview } from "@/utils/authRefresh";
import { interpretAiReviewOutcome } from "@/utils/aiReview";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ProfessorOnboardingModal({ isOpen, onClose }: Props) {
  const { user, login } = useAuth();
  const facultyRef = useRef<HTMLInputElement>(null);
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFaculty("");
      setDepartment("");
      setError(null);
      setSaving(false);
      setReviewing(false);
      setTimeout(() => facultyRef.current?.focus(), 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canSave = faculty.trim().length > 0 && department.trim().length > 0 && !saving;

  const resolveUserId = async (): Promise<number | null> => {
    if (user?.id) return Number(user.id);
    const latest = await fetchAuthMe();
    if (latest?.id) return Number(latest.id);
    const stored = localStorage.getItem("user_id");
    return stored ? Number(stored) : null;
  };

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await createProfessorProfile({
        faculty: faculty.trim(),
        department: department.trim(),
      });

      setReviewing(true);
      const userId = await resolveUserId();
      if (!userId) throw new Error("Missing user id for AI review");
      const response = await requestAiRegistrationReview(userId);
      const payload = response?.data ?? response;
      const verification = payload?.verification ?? payload;
      const tokensPayload = payload?.tokens ?? payload;
      const outcome = interpretAiReviewOutcome(verification);
      await reloginAfterAiReview(login, tokensPayload);

      if (outcome.rejected) {
        if (typeof window !== "undefined") {
          window.alert(outcome.reason || "Your application got rejected.");
        } else {
          notify.error(outcome.reason || "Your application got rejected.");
        }
      } else {
        notify.success("AI is reviewing your professor account.");
      }

      try {
        localStorage.removeItem("needs_professor_onboarding");
      } catch {}

      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save professor info");
    } finally {
      setSaving(false);
      setReviewing(false);
    }
  };

  return (
    <>
      {reviewing && (
        <LoadingOverlay
          title="Verifying your profile..."
          subtitle="Please wait while we verify your professor account."
        />
      )}
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-lg font-semibold">Professor Details</h2>
          </div>
          <div className="space-y-4 px-5 pb-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Faculty</label>
              <input
                ref={facultyRef}
                type="text"
                className="rounded-md border px-3 py-2 text-sm"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Department</label>
              <input
                type="text"
                className="rounded-md border px-3 py-2 text-sm"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 rounded-b-2xl bg-gray-50 px-5 py-3">
            <button
              onClick={handleSubmit}
              disabled={!canSave}
              className="rounded-full bg-midgreen-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
