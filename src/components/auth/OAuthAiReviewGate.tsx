"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import { requestAiRegistrationReview } from "@/api/ai";
import { fetchAuthMe } from "@/api/session";
import notify from "@/lib/toast";
import { clearPendingAiReview, getPendingAiReviewRole, isAiReviewPending } from "@/utils/aiReview";

export default function OAuthAiReviewGate() {
  const { user } = useAuth();
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (reviewing) return;
    if (!isAiReviewPending()) return;

    let isMounted = true;

    (async () => {
      setReviewing(true);
      try {
        const latest = await fetchAuthMe();
        const storedId = Number(localStorage.getItem("user_id") || "0");
        const userId = Number(latest?.id ?? storedId);
        if (!userId) throw new Error("Missing user id for AI review");

        const response = await requestAiRegistrationReview(userId);
        const payload: any = response?.data ?? response;
        const role = getPendingAiReviewRole();

        const verified =
          typeof payload?.verified === "boolean"
            ? payload.verified
            : typeof payload?.status === "string"
            ? payload.status.toLowerCase() === "approved"
            : undefined;

        if (verified === false) {
          const reason =
            payload?.ai_verification?.reason ||
            payload?.message ||
            payload?.status ||
            "AI could not verify your account.";
          if (typeof window !== "undefined") {
            window.alert(reason);
          } else {
            notify.error(reason);
          }
        } else {
          notify.success(
            role
              ? `Your ${role.toLowerCase()} account is now under AI review.`
              : "Your account is now under AI review."
          );
        }
      } catch (err: any) {
        console.error("AI review request failed:", err);
        notify.error(err?.message || "AI review failed. Please try again.");
      } finally {
        clearPendingAiReview();
        if (isMounted) setReviewing(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user, reviewing]);

  if (!reviewing) return null;

  return (
    <LoadingOverlay
      title="Screening your account…"
      subtitle="Please wait while we verify your account.."
    />
  );
}
