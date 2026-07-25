"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface RoleSelectModalProps {
  onRoleSet: () => void;
}

export default function RoleSelectModal({ onRoleSet }: RoleSelectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectRole = async (role: "citizen" | "recycler") => {
    try {
      setLoading(true);
      setError("");
      await apiFetch("/auth/set-role", {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      onRoleSet();
    } catch (err: any) {
      setError(err.message || "Failed to save role choice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-text)] text-xs font-semibold uppercase tracking-wider">
            Welcome to IWIS
          </span>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Are you a Citizen or a Recycler?
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Choose your primary account type to get started. You can change options later in settings.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-xs text-[var(--destructive)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleSelectRole("citizen")}
            disabled={loading}
            className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all flex flex-col items-center text-center group disabled:opacity-50"
          >
            <span className="text-3xl mb-2">🌱</span>
            <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-text)]">
              Citizen
            </span>
            <span className="text-xs text-[var(--text-secondary)] mt-1">
              Sell waste & track eco-impact
            </span>
          </button>

          <button
            onClick={() => handleSelectRole("recycler")}
            disabled={loading}
            className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all flex flex-col items-center text-center group disabled:opacity-50"
          >
            <span className="text-3xl mb-2">♻️</span>
            <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-text)]">
              Recycler
            </span>
            <span className="text-xs text-[var(--text-secondary)] mt-1">
              Collect waste & bid on listings
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
