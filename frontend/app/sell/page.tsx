"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { AlertIcon, ArrowRightIcon } from "@/components/ui/Icons";

const MATERIALS = [
  "Plastic",
  "Cardboard",
  "Paper",
  "E-Waste",
  "Glass",
  "Metal",
  "Organic",
  "Mixed"
];

export default function SellWastePage() {
  const router = useRouter();
  const [materialType, setMaterialType] = useState("Plastic");
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("material");
    if (m && MATERIALS.includes(m)) {
      setMaterialType(m);
    }
  }, []);
  const [weight, setWeight] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !weight) {
      setError("Please provide an estimated weight and pickup address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      await apiFetch("/listings", {
        method: "POST",
        body: JSON.stringify({
          materialType,
          estimatedWeightKg: parseFloat(weight),
          pickupAddress: address.trim(),
          description: description.trim(),
          // Defaulting coordinates to a central point for the MVP
          lat: 32.7266, 
          lng: 74.8570
        }),
      });

      router.push("/sell/history");
    } catch (err: any) {
      setError(err.backendMessage || err.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 animate-fadeIn">
        <div className="mb-8">
          <p className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider mb-1">
            Citizen Action
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Sell Bulk Waste
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Create a listing for recyclers in your area to pick up your bulk waste directly from your home.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
            <AlertIcon size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-6">
            
            {/* Material Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                What are you selling?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MATERIALS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMaterialType(m)}
                    className={`py-2 px-3 text-sm rounded-lg border transition-all text-center ${
                      materialType === m
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)] font-semibold"
                        : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Estimated Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                min="0.5"
                step="0.5"
                placeholder="e.g., 5.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>

            {/* Pickup Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Pickup Address
              </label>
              <textarea
                id="address"
                rows={3}
                placeholder="Full address with landmark..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-all resize-none"
              />
            </div>

            {/* Optional Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Additional Details (Optional)
              </label>
              <input
                id="description"
                type="text"
                placeholder="e.g., Mostly empty water bottles"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={loading || !weight || !address.trim()}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Posting Listing...
              </span>
            ) : (
              <>
                Post Waste Listing
                <ArrowRightIcon size={14} />
              </>
            )}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
