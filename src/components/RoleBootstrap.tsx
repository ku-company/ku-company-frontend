"use client";

import { useEffect, useMemo, useState } from "react";
import RoleSelectModal from "@/components/roleselector";
import CompanyOnboardingModal from "@/components/CompanyOnboardingModal";
import ProfessorOnboardingModal from "@/components/ProfessorOnboardingModal";
import GoogleConsentModal from "@/components/GoogleConsentModal";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useAuth } from "@/context/AuthContext";
import { getAuthMe, updateUserRole, refreshAccessToken } from "@/api/user";
import { getCompanyProfile } from "@/api/companyprofile";
import type { GoogleSignupRole } from "@/api/oauth";
import { interpretAiReviewOutcome, markPendingAiReview } from "@/utils/aiReview";
import { attachStudentId } from "@/api/student";
import { requestAiRegistrationReview } from "@/api/ai";
import notify from "@/lib/toast";
import { reloginAfterAiReview } from "@/utils/authRefresh";

function normalizeRole(r?: string | null) {
  const raw = (r ?? "").trim().toLowerCase();
  if (!raw || raw.includes("unknown") || raw.includes("unset")) return "Unknown";
  if (raw.includes("company")) return "Company";
  if (raw.includes("student")) return "Student";
  if (raw.includes("professor")) return "Professor";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function RoleBootstrap() {
  const { user, isReady, login, logout, setLocalRole } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [patchingRole, setPatchingRole] = useState(false);
  const [showCompanyOnboarding, setShowCompanyOnboarding] = useState(false);
  const [showProfessorOnboarding, setShowProfessorOnboarding] = useState(false);
  const [pendingRole, setPendingRole] = useState<GoogleSignupRole | null>(null);
  const [pendingStudentId, setPendingStudentId] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [aiReviewing, setAiReviewing] = useState(false);

  const isUnknown = useMemo(() => normalizeRole(user?.role) === "Unknown", [user?.role]);

  // Persist helper for new tokens coming from the backend
  function persistTokens(tokenPair: { access_token?: string; refresh_token?: string }) {
    if (tokenPair?.access_token) localStorage.setItem("access_token", tokenPair.access_token);
    if (tokenPair?.refresh_token) localStorage.setItem("refresh_token", tokenPair.refresh_token);
  }

  useEffect(() => {
    if (!isReady || !user) {
      setShowRoleModal(false);
      setShowConsentModal(false);
      setPendingRole(null);
      setPendingStudentId("");
      setShowCompanyOnboarding(false);
      setShowProfessorOnboarding(false);
      return;
    }
    if (user && isUnknown) {
      setShowRoleModal(true);
    } else {
      setShowRoleModal(false);
    }

    // If user is a Company and signup flow marked onboarding, open only if country is empty
    (async () => {
      try {
        const roleNorm = (user?.role ?? "").toLowerCase();
        if (!roleNorm.includes("company")) return;
        const needs = typeof window !== "undefined" ? localStorage.getItem("needs_company_onboarding") : null;
        if (needs !== "1") return;

        // Check profile country before showing modal
        try {
          const profile = await getCompanyProfile();
          const shouldOpen = !profile || profile.country === "";
          if (shouldOpen) {
            setShowCompanyOnboarding(true);
          } else {
            // Country already set; clear the flag so it won't show in future logins
            if (typeof window !== "undefined") localStorage.removeItem("needs_company_onboarding");
          }
        } catch (e) {
          console.warn("company profile check failed", e);
          // Open modal on failure to avoid losing the opportunity in race conditions
          setShowCompanyOnboarding(true);
        }
      } catch {}
    })();

    // Show professor onboarding when flagged
    (async () => {
      try {
        const roleNorm = (user?.role ?? "").toLowerCase();
        if (!roleNorm.includes("professor")) return;
        const needs = typeof window !== "undefined" ? localStorage.getItem("needs_professor_onboarding") : null;
        if (needs !== "1") return;
        setShowProfessorOnboarding(true);
      } catch {}
    })();

  }, [isReady, user, isUnknown]);

  // Note: no secondary guard; onboarding modal opens only when flagged by signup flow.

  function handleRoleSelect(selected: string) {
    const normalized = selected.toLowerCase();
    const payloadRole: GoogleSignupRole =
      normalized === "company" ? "Company" : normalized === "professor" ? "Professor" : "Student";

    setConsentError(null);
    setLocalRole(payloadRole);
    setPendingRole(payloadRole);
    setPendingStudentId("");
    setShowConsentModal(true);
  }

  async function completeRoleSelection(studentId?: string) {
    if (!pendingRole) return;
    let aiReviewHandled = false;
    try {
      setConsentBusy(true);
      setPatchingRole(true);
      setConsentError(null);

      const trimmedStudentId = (studentId || "").trim();

      const patchData = await updateUserRole(pendingRole, {
        studentId: trimmedStudentId,
        consent: true,
      });
      persistTokens({ access_token: patchData.access_token, refresh_token: patchData.refresh_token });
      const newToken = patchData.access_token || localStorage.getItem("access_token") || "";
      const me2 = await getAuthMe(newToken);

      // Final role
      const finalRole = normalizeRole(me2.role ?? me2.roles ?? patchData.role);

      // Update AuthContext (this updates Navbar too)
      login({
        access_token: localStorage.getItem("access_token") ?? "",
        refresh_token: localStorage.getItem("refresh_token") ?? "",
        user_name: me2.user_name ?? patchData.user_name ?? "",
        email: me2.email ?? patchData.email ?? "",
        roles: finalRole,
      });

      if (finalRole === "Student" && trimmedStudentId) {
        await attachStudentId(trimmedStudentId);
        try {
          localStorage.setItem("last_student_id", trimmedStudentId);
        } catch {}
      }

      let resolvedUserId: number | undefined;
      if (typeof me2.id === "number") {
        resolvedUserId = me2.id;
      } else if (typeof patchData.id === "number") {
        resolvedUserId = patchData.id;
      } else {
        try {
          const stored = localStorage.getItem("user_id");
          if (stored) resolvedUserId = Number(stored);
        } catch {}
      }

      if (finalRole === "Student") {
        aiReviewHandled = await runImmediateAiReview("Student", resolvedUserId);
      }

      if (finalRole === "Company") {
        try { localStorage.setItem("needs_company_onboarding", "1"); } catch {}
        aiReviewHandled = true;
      }

      if (finalRole === "Professor") {
        try { localStorage.setItem("needs_professor_onboarding", "1"); } catch {}
        aiReviewHandled = true;
      }

      if (!aiReviewHandled && (finalRole === "Company" || finalRole === "Professor" || finalRole === "Student")) {
        markPendingAiReview(finalRole as GoogleSignupRole);
      }

      if (finalRole !== "Unknown") {
        setShowRoleModal(false);
      }

      if (finalRole === "Company") {
        setShowCompanyOnboarding(true);
      }

      if (finalRole === "Professor") {
        setShowProfessorOnboarding(true);
      }

      setShowConsentModal(false);
      setPendingRole(null);
    } catch (err: any) {
      console.error("Failed to update role:", err);
      setConsentError(err?.message || "Failed to update role. Please try again.");
    } finally {
      setConsentBusy(false);
      setPatchingRole(false);
    }
  }

  function handleConsentReject() {
    setShowConsentModal(false);
    setPendingRole(null);
    setPendingStudentId("");
    logout().catch(() => {});
  }

  async function runImmediateAiReview(role: GoogleSignupRole, userId?: number) {
    if (role !== "Student" || !userId) return false;
    setAiReviewing(true);
    try {
      const response = await requestAiRegistrationReview(userId);
      const payload = response?.data ?? response;
      let refreshedTokens: any = null;
      try {
        refreshedTokens = await refreshAccessToken();
      } catch (refreshErr) {
        console.warn("Failed to refresh token after AI review:", refreshErr);
      }
      const outcome = interpretAiReviewOutcome(payload);
      await reloginAfterAiReview(login, refreshedTokens ?? payload);

      if (outcome.rejected) {
        if (typeof window !== "undefined") {
          window.alert(outcome.reason || "Your application got rejected.");
        } else {
          notify.error(outcome.reason || "Your application got rejected.");
        }
      } else {
        notify.success("AI is reviewing your student account.");
      }
      return true;
    } catch (err: any) {
      console.error("AI review request failed:", err);
      notify.error(err?.message || "AI review failed. We'll retry shortly.");
      return false;
    } finally {
      setAiReviewing(false);
    }
  }

  return (
    <>
      {showRoleModal && (
        <RoleSelectModal
          isOpen={showRoleModal}
          onClose={() => !patchingRole && setShowRoleModal(false)}
          onSelect={handleRoleSelect}
          disableClose
        />
      )}
      {showCompanyOnboarding && (
        <CompanyOnboardingModal
          isOpen={showCompanyOnboarding}
          onClose={() => {
            try {
              if (typeof window !== "undefined") localStorage.removeItem("needs_company_onboarding");
            } catch {}
            setShowCompanyOnboarding(false);
          }}
        />
      )}
      {showProfessorOnboarding && (
        <ProfessorOnboardingModal
          isOpen={showProfessorOnboarding}
          onClose={() => {
            try {
              if (typeof window !== "undefined") localStorage.removeItem("needs_professor_onboarding");
            } catch {}
            setShowProfessorOnboarding(false);
          }}
        />
      )}
      {pendingRole && (
        <GoogleConsentModal
          isOpen={showConsentModal}
          role={pendingRole}
          requireStudentId={pendingRole === "Student"}
          initialStudentId={pendingStudentId}
          submitting={consentBusy}
          externalError={consentError}
          onCancel={handleConsentReject}
          onConfirm={({ studentId }) => {
            const trimmed = (studentId || "").trim();
            setPendingStudentId(trimmed);
            completeRoleSelection(trimmed);
          }}
        />
      )}
      {aiReviewing && (
        <LoadingOverlay
          title="Verifying your student account…"
          subtitle="Please wait while we verify your student account."
        />
      )}
    </>
  );
}

