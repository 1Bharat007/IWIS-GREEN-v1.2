"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { ArrowRightIcon, AlertIcon } from "@/components/ui/Icons";

export default function SchedulePickupPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<any>(null);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("Morning (8AM - 12PM)");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/listings/${id}`)
      .then((data) => setListing(data))
      .catch((err) => setError(err.message))
      .finally(() => setFetching(false));
  }, [id]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await apiFetch(`/listings/${id}/schedule`, {
        method: "POST",
        body: JSON.stringify({ scheduledDate: date, scheduledTimeSlot: timeSlot }),
      });
      // Redirect to confirm page for demo purposes
      router.push(`/recycler/pickup/${id}/confirm`);
    } catch (err: any) {
      setError(err.backendMessage || err.message || "Failed to schedule pickup.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-[60vh] text-[var(--text-tertiary)]">
          <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mr-2" />
          Loading pickup details...
        </div>
      </ProtectedRoute>
    );
  }

  if (!listing) {
    return (
      <ProtectedRoute>
        <div className="max-w-xl mx-auto py-12 px-4 text-center">
          <h1 className="text-xl font-bold text-[var(--destructive)]">Listing not found</h1>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 animate-fadeIn">
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider mb-1">
            Step 1 of 2
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Schedule Pickup
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Let the citizen know when you will arrive to collect the {listing.materialType}.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
            <AlertIcon size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="bg-[var(--surface-raised)] border border-[var(--border)] p-5 rounded-2xl mb-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Pickup Location</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">{listing.pickupAddress}</p>
          <div className="flex gap-4 border-t border-[var(--border)] pt-4 mt-2">
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Citizen</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{listing.citizenName || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Est. Weight</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{listing.estimatedWeightKg} kg</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSchedule} className="space-y-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Date of Arrival
              </label>
              <input
                type="date"
                required
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
              >
                <option value="Morning (8AM - 12PM)">Morning (8 AM - 12 PM)</option>
                <option value="Afternoon (12PM - 4PM)">Afternoon (12 PM - 4 PM)</option>
                <option value="Evening (4PM - 8PM)">Evening (4 PM - 8 PM)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !date}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? "Saving..." : "Confirm Schedule"}
            <ArrowRightIcon size={14} />
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
