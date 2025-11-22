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

export type AiReviewOutcome = {
  rejected: boolean;
  approved: boolean;
  reason?: string;
};

export function interpretAiReviewOutcome(payload: any): AiReviewOutcome {
  const getStatusString = () => {
    const candidates = [
      payload?.status,
      payload?.result,
      payload?.ai_verification?.status,
      payload?.ai_verification?.result,
      payload?.data?.status,
      payload?.data?.result,
    ];
    for (const entry of candidates) {
      if (typeof entry === "string" && entry.trim().length) {
        return entry.trim().toLowerCase();
      }
    }
    return "";
  };

  const statusText = payload ? getStatusString() : "";
  const boolCandidates = [
    payload?.verified,
    payload?.approved,
    payload?.ai_verification?.verified,
    payload?.ai_verification?.approved,
  ];

  let approvedState: boolean | null = null;
  for (const candidate of boolCandidates) {
    if (typeof candidate === "boolean") {
      approvedState = candidate;
      break;
    }
  }

  if (approvedState === null && statusText) {
    if (/(reject|denied|fail|blocked)/.test(statusText)) {
      approvedState = false;
    } else if (/(approve|success|pass|accept)/.test(statusText)) {
      approvedState = true;
    }
  }

  const reason =
    payload?.ai_verification?.reason ||
    payload?.reason ||
    payload?.message ||
    payload?.ai_verification?.detail ||
    payload?.detail ||
    undefined;

  return {
    rejected: approvedState === false,
    approved: approvedState === true,
    reason,
  };
}
