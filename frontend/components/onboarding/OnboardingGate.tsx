"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";
import RoleSelectModal from "./RoleSelectModal";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);

  const fetchMe = useCallback(async () => {
    if (!isSignedIn) return;
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
  }, [isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchMe();
    }
  }, [isLoaded, isSignedIn, fetchMe]);

  return (
    <>
      {isSignedIn && requiresOnboarding && (
        <RoleSelectModal onRoleSet={fetchMe} />
      )}
      {children}
    </>
  );
}
