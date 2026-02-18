"use client";

import { useEffect, useState } from "react";

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("iwis-onboarded");
    if (!seen) setOpen(true);
  }, []);

  const close = () => {
    localStorage.setItem("iwis-onboarded", "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#111827] p-10 rounded-3xl shadow-xl max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Welcome to IWIS
        </h2>
        <p className="mb-6">
          Scan waste, earn impact points, and track your carbon reduction journey.
        </p>
        <button
          onClick={close}
          className="px-6 py-2 bg-emerald-600 text-white rounded-full"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
