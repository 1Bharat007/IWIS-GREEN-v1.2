"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import RoleSelectModal from "./RoleSelectModal";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const res = await apiFetch("/auth/me");
      const data = res?.data || res;
      if (data && data.requiresOnboarding) {
        setRequiresOnboarding(true);
      } else {
        setRequiresOnboarding(false);
      }
    } catch {
      // Ignore network errors or unauthenticated state quietly
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <>
      {requiresOnboarding && (
        <RoleSelectModal onRoleSet={fetchMe} />
      )}
      {children}
    </>
  );
}
