"use client";

import { useEffect, useMemo, useState } from "react";
import RoleSelectModal from "@/components/roleselector";
import CompanyOnboardingModal from "@/components/CompanyOnboardingModal";
import GoogleConsentModal from "@/components/GoogleConsentModal";
import { useAuth } from "@/context/AuthContext";
import { getAuthMe, updateUserRole } from "@/api/user";
import { createProfessorProfile } from "@/api/professorprofile";
import { getCompanyProfile } from "@/api/companyprofile";
import type { GoogleSignupRole } from "@/api/oauth";
import { markPendingAiReview } from "@/utils/aiReview";

function normalizeRole(r?: string | null) {
  const raw = (r ?? "").trim().toLowerCase();
  if (!raw || raw.includes("unknown") || raw.includes("unset")) return "Unknown";
  if (raw.includes("company")) return "Company";
  if (raw.includes("student")) return "Student";
  if (raw.includes("professor")) return "Professor";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function RoleBootstrap() {
  const { user, isReady, login, logout } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [patchingRole, setPatchingRole] = useState(false);
  const [showCompanyOnboarding, setShowCompanyOnboarding] = useState(false);
  const [pendingRole, setPendingRole] = useState<GoogleSignupRole | null>(null);
  const [pendingStudentId, setPendingStudentId] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

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

  }, [isReady, user, isUnknown]);

  // Note: no secondary guard; onboarding modal opens only when flagged by signup flow.

  function handleRoleSelect(selected: string) {
    const normalized = selected.toLowerCase();
    const payloadRole: GoogleSignupRole =
      normalized === "company" ? "Company" : normalized === "professor" ? "Professor" : "Student";

    setConsentError(null);
    setPendingRole(payloadRole);
    setPendingStudentId("");
    setShowConsentModal(true);
  }

  async function completeRoleSelection(studentId?: string) {
    if (!pendingRole) return;
    try {
      setConsentBusy(true);
      setPatchingRole(true);
      setConsentError(null);

      const patchData = await updateUserRole(pendingRole, {
        studentId,
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

      if (finalRole === "Professor") {
        try {
          await createProfessorProfile({ department: "computer", faculty: "engineering" });
        } catch (e) {
          // Ignore if already exists or backend glitches
          console.warn("Professor profile auto-create skipped:", e);
        }
      }

      if (finalRole === "Company" || finalRole === "Professor" || finalRole === "Student") {
        markPendingAiReview(finalRole as GoogleSignupRole);
      }

      if (finalRole !== "Unknown") {
        setShowRoleModal(false);
      }

      if (finalRole === "Company") {
        setShowCompanyOnboarding(true);
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
    </>
  );
}

