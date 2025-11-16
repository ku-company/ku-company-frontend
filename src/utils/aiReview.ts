"use client";

import type { GoogleSignupRole } from "@/api/oauth";

const FLAG_KEY = "pending_ai_review";
const ROLE_KEY = "pending_ai_review_role";

export function markPendingAiReview(role: GoogleSignupRole) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FLAG_KEY, "1");
    localStorage.setItem(ROLE_KEY, role);
  } catch (err) {
    console.warn("Unable to persist AI review marker:", err);
  }
}

export function clearPendingAiReview() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(FLAG_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch (err) {
    console.warn("Unable to clear AI review marker:", err);
  }
}

export function isAiReviewPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function getPendingAiReviewRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ROLE_KEY);
  } catch {
    return null;
  }
}

export const AI_REVIEW_STORAGE = {
  FLAG_KEY,
  ROLE_KEY,
};
