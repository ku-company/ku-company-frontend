"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyProfessorProfile } from "@/api/professorprofile";
import ProfessorOnboardingModal from "@/components/auth/ProfessorOnboardingModal";

export default function ProfessorOnboardingBootstrap() {
  const { user, isReady } = useAuth();
  const role = useMemo(() => (user?.role || "").toLowerCase(), [user?.role]);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (role !== "professor") { setNeedsProfile(false); return; }
    (async () => {
      try {
        const profile = await getMyProfessorProfile();
        setNeedsProfile(!profile);
      } catch {
        setNeedsProfile(true);
      }
    })();
  }, [isReady, role]);

  if (role !== "professor") return null;
  return (
    <ProfessorOnboardingModal
      isOpen={needsProfile}
      onClose={() => setNeedsProfile(false)}
      onCreated={() => setNeedsProfile(false)}
    />
  );
}

