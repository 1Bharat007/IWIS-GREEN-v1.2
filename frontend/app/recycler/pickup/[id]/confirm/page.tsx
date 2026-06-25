"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { ArrowRightIcon, AlertIcon, CheckIcon } from "@/components/ui/Icons";

export default function ConfirmPickupPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<any>(null);
  const [actualWeight, setActualWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch(`/listings/${id}`)
      .then((data) => setListing(data))
      .catch((err) => setError(err.message))
      .finally(() => setFetching(false));
  }, [id]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await apiFetch(`/listings/${id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ actualWeightKg: parseFloat(actualWeight) }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.backendMessage || err.message || "Failed to confirm pickup.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-[60vh] text-[var(--text-tertiary)]">
          <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mr-2" />
        </div>
      </ProtectedRoute>
    );
  }

  if (success) {
    return (
      <ProtectedRoute>
        <div className="max-w-md mx-auto py-20 px-4 text-center animate-fadeIn">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Pickup Complete!</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            The transaction has been logged and the citizen's account has been updated.
          </p>
          <button
            onClick={() => router.push("/recycler/feed")}
            className="w-full py-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-medium hover:bg-[var(--surface)] transition-all"
          >
            Return to Feed
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 animate-fadeIn">
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider mb-1">
            Step 2 of 2
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Confirm Collection
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            You are at the pickup location. Weigh the waste and log the final transaction.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
            <AlertIcon size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Final Scaled Weight (kg)
              </label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                placeholder={`Citizen estimated ${listing?.estimatedWeightKg} kg`}
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>
            
            {actualWeight && (
              <div className="p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex justify-between items-center">
                <span className="text-sm text-[var(--accent-text)] font-medium">Estimated Payout:</span>
                <span className="text-lg font-bold text-[var(--accent-text)]">₹{(parseFloat(actualWeight) * 10).toFixed(2)}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !actualWeight}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? "Processing..." : "Complete Pickup & Generate Transaction"}
            <ArrowRightIcon size={14} />
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
