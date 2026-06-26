"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { AlertIcon, ArrowRightIcon, CheckCircleIcon, HistoryIcon, MapPinIcon } from "@/components/ui/Icons";
import { useDraft } from "@/hooks/useDraft";
import Link from "next/link";

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

  const [draft, setDraft, clearDraft] = useDraft("draft_sell_waste", {
    materialType: "Plastic",
    wasteVolume: "Medium Bag",
    weight: "",
    address: "",
    description: "",
    lat: null as number | null,
    lng: null as number | null
  });

  const materialType = draft.materialType;
  const wasteVolume = draft.wasteVolume;
  const weight = draft.weight;
  const address = draft.address;
  const description = draft.description;
  const lat = draft.lat;
  const lng = draft.lng;

  const setMaterialType = (v: string) => setDraft({ ...draft, materialType: v });
  const setWasteVolume = (v: string) => setDraft({ ...draft, wasteVolume: v });
  const setWeight = (v: string) => setDraft({ ...draft, weight: v });
  const setAddress = (v: string) => setDraft({ ...draft, address: v });
  const setDescription = (v: string) => setDraft({ ...draft, description: v });
  const setLat = (v: number | null) => setDraft({ ...draft, lat: v });
  const setLng = (v: number | null) => setDraft({ ...draft, lng: v });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("material");
    const v = params.get("volume");
    if (m && MATERIALS.includes(m)) {
      setMaterialType(m);
    }
    if (v) {
      setWasteVolume(v);
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please enter your address manually.");
      return;
    }
    
    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLng(longitude);

        try {
          // Reverse geocoding using OpenStreetMap Nominatim (free, no key required)
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              setAddress(data.display_name);
            } else {
              setAddress(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            }
          } else {
            setAddress(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          }
        } catch (err) {
          setAddress(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        setLocating(false);
        let msg = "Failed to get location. Please enter your address manually.";
        if (geoError.code === geoError.PERMISSION_DENIED) {
          msg = "Location permission denied. Please enter your address manually.";
        }
        setError(msg);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || (!wasteVolume && !weight)) {
      setError("Please provide a waste quantity and pickup address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      await apiFetch("/listings", {
        method: "POST",
        body: JSON.stringify({
          materialType,
          wasteVolume,
          estimatedWeightKg: weight ? parseFloat(weight) : undefined,
          pickupAddress: address.trim(),
          description: description.trim(),
          lat: lat || 32.7266, 
          lng: lng || 74.8570
        }),
      });

      clearDraft();
      setSuccess(true);
      window.scrollTo(0, 0);
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
            Create a listing for recyclers in your area to collect waste directly from your home.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
            <AlertIcon size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {success ? (
          <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center shadow-sm space-y-6">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-subtle)] border-4 border-[var(--bg)] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircleIcon size={32} className="text-[var(--accent)]" />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Listing Created!</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
                Your waste has been successfully listed. Local Kabadiwalas will be notified and can accept your listing for pickup.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-raised)] flex items-start gap-3 text-sm text-[var(--text-secondary)] text-left">
              <span className="shrink-0 text-xl mt-0.5">💡</span>
              <p>Keep your phone nearby. The recycler will contact you when they arrive at the pickup address.</p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/sell/history"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg)] text-[15px] font-medium shadow-md hover:scale-[1.02] transition-transform"
              >
                <HistoryIcon size={16} />
                Track My Listing
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setWeight("");
                  setDescription("");
                  setAddress("");
                  setLat(null);
                  setLng(null);
                }}
                className="px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-[15px] font-medium hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        ) : (
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

            {/* Volume Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                How much waste do you have?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "Small Bag", icon: "🛍️", desc: "Fits in a grocery bag", capacity: "~1-3 kg" },
                  { id: "Medium Bag", icon: "🎒", desc: "Standard garbage bag", capacity: "~5-10 kg" },
                  { id: "Large Sack", icon: "🗑️", desc: "Large gunny sack (Bora)", capacity: "~15-25 kg" },
                  { id: "Bulk Quantity", icon: "🚚", desc: "Multiple sacks / Tempo", capacity: "50+ kg" },
                ].map((vol) => (
                  <button
                    key={vol.id}
                    type="button"
                    onClick={() => setWasteVolume(vol.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      wasteVolume === vol.id
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                        : "border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{vol.icon}</span>
                      {wasteVolume === vol.id && <CheckCircleIcon size={16} className="text-[var(--accent)]" />}
                    </div>
                    <p className={`font-semibold text-sm ${wasteVolume === vol.id ? "text-[var(--accent-text)]" : "text-[var(--text-primary)]"}`}>
                      {vol.id}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">{vol.desc}</p>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] mt-1">{vol.capacity}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Estimated Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Approximate Weight (Optional)
              </label>
              <div className="relative">
                <input
                  id="weight"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="e.g., 5.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">kg</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">If you're unsure, leave this blank. The recycler will weigh it during pickup.</p>
            </div>

            {/* Pickup Address */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="address" className="block text-sm font-medium text-[var(--text-primary)]">
                  Pickup Address
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                >
                  {locating ? (
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MapPinIcon size={14} />
                  )}
                  {locating ? "Locating..." : "📍 Use Current Location"}
                </button>
              </div>
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
            disabled={loading || !wasteVolume || !address.trim()}
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
        )}
      </div>
    </ProtectedRoute>
  );
}
