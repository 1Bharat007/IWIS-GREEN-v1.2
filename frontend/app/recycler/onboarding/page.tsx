"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { AlertIcon, CheckIcon, ArrowRightIcon } from "@/components/ui/Icons";

const MATERIALS = [
  "Plastic",
  "Cardboard",
  "Paper",
  "E-Waste",
  "Glass",
  "Metal",
  "Organic"
];

export default function RecyclerOnboarding() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [radius, setRadius] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleMaterial = (m: string) => {
    setMaterials((prev) => 
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || materials.length === 0) {
      setError("Business name and at least one material are required.");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      await apiFetch("/recycler/profile", {
        method: "POST",
        body: JSON.stringify({
          businessName: businessName.trim(),
          gstin: gstin.trim(),
          acceptedMaterials: materials,
          serviceRadiusKm: radius,
          lat: 32.7266, // Default to Jammu for MVP
          lng: 74.8570
        })
      });
      router.push("/recycler/feed"); 
    } catch (err: any) {
      setError(err.backendMessage || err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 animate-fadeIn">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Complete your Recycler Profile
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Tell us about your business and what materials you accept. This helps citizens find you.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
            <AlertIcon size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Business Details</h2>
            
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Business Name <span className="text-[var(--destructive)]">*</span>
              </label>
              <input
                id="businessName"
                type="text"
                placeholder="e.g. Jammu Scrap Traders"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="gstin" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                GSTIN (Optional)
              </label>
              <input
                id="gstin"
                type="text"
                placeholder="Enter 15-digit GSTIN"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">Adding GSTIN helps verify your business faster.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Accepted Materials</h2>
            <p className="text-xs text-[var(--text-secondary)] -mt-2">Select the types of waste you purchase.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MATERIALS.map((m) => {
                const selected = materials.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMaterial(m)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                      selected 
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)] ring-1 ring-[var(--accent)]" 
                        : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      selected ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)] bg-[var(--surface)]"
                    }`}>
                      {selected && <CheckIcon size={10} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Service Radius</h2>
            
            <div>
              <label className="flex justify-between items-center text-sm font-medium text-[var(--text-secondary)] mb-3">
                <span>Maximum Pickup Distance</span>
                <span className="text-[var(--accent-text)] font-semibold">{radius} km</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-[var(--surface-raised)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-2">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={loading || !businessName || materials.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving Profile…
                </span>
              ) : (
                <>
                  Complete Setup
                  <ArrowRightIcon size={14} />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </ProtectedRoute>
  );
}
