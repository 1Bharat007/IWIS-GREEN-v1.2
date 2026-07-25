"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { ArrowRightIcon, AlertIcon, CheckIcon } from "@/components/ui/Icons";
import { motion } from "framer-motion";

export default function ConfirmPickupPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<any>(null);
  const [actualWeight, setActualWeight] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmedTx, setConfirmedTx] = useState<{
    citizenEarnings: number;
    citizenName: string;
    citizenUpiId: string | null;
    paymentMethod: string;
  } | null>(null);

  useEffect(() => {
    apiFetch(`/listings/${id}`)
      .then((res) => setListing(res?.data || res))
      .catch((err) => setError(err.message))
      .finally(() => setFetching(false));
  }, [id]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "upi" && !listing?.citizenUpiId) {
      setError("Citizen hasn't added a UPI ID — use cash.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch(`/listings/${id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ 
          actualWeightKg: parseFloat(actualWeight),
          paymentMethod 
        }),
      });
      setConfirmedTx({
        citizenEarnings: res?.citizenEarnings ?? 0,
        citizenName: res?.citizenName || listing?.citizenName || "Citizen",
        citizenUpiId: res?.citizenUpiId || listing?.citizenUpiId || null,
        paymentMethod
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
    const isUpi = confirmedTx?.paymentMethod === "upi" && confirmedTx?.citizenUpiId;
    const upiUrl = isUpi
      ? `upi://pay?pa=${confirmedTx.citizenUpiId}&pn=${encodeURIComponent(confirmedTx.citizenName)}&am=${confirmedTx.citizenEarnings.toFixed(2)}&cu=INR&tn=IWIS%20Pickup%20Payment`
      : "";

    return (
      <ProtectedRoute>
        <div className="max-w-md mx-auto py-16 px-4 text-center animate-fadeIn">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Collection Complete!</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            The transaction has been logged server-side. Final payout calculated: <strong className="text-[var(--text-primary)]">₹{confirmedTx?.citizenEarnings.toFixed(2)}</strong>.
          </p>

          {isUpi ? (
            <div className="mb-6 p-5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] space-y-3">
              <p className="text-xs text-[var(--text-secondary)]">
                Recipient: <strong className="text-[var(--text-primary)]">{confirmedTx.citizenName}</strong> ({confirmedTx.citizenUpiId})
              </p>
              <button
                onClick={() => { window.location.href = upiUrl; }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                Pay ₹{confirmedTx.citizenEarnings.toFixed(2)} via UPI
              </button>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Tapping opens your installed UPI app (GPay, PhonePe, Paytm).
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
              Cash payment recorded. Please hand over <strong>₹{confirmedTx?.citizenEarnings.toFixed(2)}</strong> to {confirmedTx?.citizenName || "the citizen"}.
            </div>
          )}

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
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="max-w-xl mx-auto py-8 px-4 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider mb-1">
            Step 2 of 2
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Confirm Collection
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            You are at the collection location. Weigh the waste and log the final transaction.
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
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)] font-medium' : 'border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'}`}>
                  <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                  💵 Paid Cash
                </label>
                <label className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)] font-medium' : 'border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'}`}>
                  <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                  📱 Paid via UPI
                </label>
              </div>
              {paymentMethod === 'upi' && !listing?.citizenUpiId && (
                <p className="mt-2.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                  <AlertIcon size={14} />
                  Citizen hasn't added a UPI ID — use cash
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !actualWeight || (paymentMethod === "upi" && !listing?.citizenUpiId)}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                Complete Collection & Generate Transaction
                <ArrowRightIcon size={14} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </ProtectedRoute>
  );
}
