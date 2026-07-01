"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { ArrowRightIcon } from "@/components/ui/Icons";

type Listing = {
  id: string;
  materialType: string;
  wasteVolume?: string;
  estimatedWeightKg?: number;
  status: string;
  createdAt: string;
  pickupAddress: string;
  recyclerName?: string;
  recyclerBusinessName?: string;
  recyclerPhone?: string;
  recyclerRating?: number;
  recyclerVerified?: number;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
};

import { demoListingsHistory } from "@/lib/demo/listings";

export default function SellHistoryPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/listings/my")
      .then((data) => {
        if (data.length === 0 && process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
          setListings(demoListingsHistory);
        } else {
          setListings(data);
        }
      })
      .catch((err) => setError(err.message || "Failed to load history."))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "listed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "accepted":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "scheduled":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">My Waste Listings</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Track the status of your listed waste.</p>
          </div>
          <Link
            href="/sell"
            className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Create New Listing
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--text-tertiary)]">
            <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mr-2" />
            Loading your listings...
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-[var(--destructive-bg)] text-[var(--destructive)] text-sm text-center">
            {error}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="w-16 h-16 bg-[var(--surface-raised)] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No listings yet</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
              You haven't posted any waste for collection yet. Create your first listing to start earning.
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 py-2 px-5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--surface-raised)] transition-all"
            >
              Post Waste
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((item, index) => (
              <div 
                key={item.id} 
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-border)] transition-colors animate-slideUp shadow-sm"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {item.materialType} 
                      <span className="text-[var(--text-tertiary)] font-normal ml-2">
                        {item.wasteVolume || "Medium Bag"}
                        {item.estimatedWeightKg ? ` (${item.estimatedWeightKg} kg)` : ""}
                      </span>
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Posted on {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border uppercase tracking-wider ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                
                {/* Visual Progress Tracker */}
                <div className="mb-4 px-1">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--surface-raised)] rounded-full -z-10" />
                    {["listed", "accepted", "scheduled", "completed"].map((step, idx) => {
                      const statusWeights: Record<string, number> = {
                        "listed": 0, "accepted": 1, "scheduled": 2, "completed": 3, "cancelled": -1
                      };
                      const currentWeight = statusWeights[item.status.toLowerCase()] ?? 0;
                      const stepWeight = statusWeights[step];
                      
                      const isPast = currentWeight >= stepWeight;
                      const isCurrent = currentWeight === stepWeight;
                      
                      // Cancelled state handling
                      if (item.status.toLowerCase() === "cancelled" && stepWeight > 0) return null;

                      return (
                        <div key={step} className="flex flex-col items-center gap-1.5 bg-[var(--surface)] px-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isPast 
                              ? "bg-[var(--accent)] border-[var(--accent)] text-white" 
                              : "bg-[var(--surface)] border-[var(--border-strong)]"
                          }`}>
                            {isPast && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                            isCurrent ? "text-[var(--text-primary)]" : isPast ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"
                          }`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-sm text-[var(--text-secondary)] bg-[var(--surface-raised)] p-3 rounded-lg mb-3">
                  <span className="font-medium text-[var(--text-primary)]">Pickup at:</span> {item.pickupAddress}
                </div>

                {/* Recycler Trust Card */}
                {(item.status === 'accepted' || item.status === 'scheduled' || item.status === 'completed') && item.recyclerName && (
                  <div className="mt-4 p-4 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-subtle)]">
                    <p className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider mb-3">
                      Assigned Recycler
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-[var(--text-primary)] text-base">
                            {item.recyclerBusinessName || item.recyclerName}
                          </h4>
                          {item.recyclerVerified === 1 && (
                            <span className="text-blue-500 bg-blue-100 rounded-full px-1.5 py-0.5 text-[10px] font-bold" title="Verified Kabadiwala">
                              ✓ VERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {item.recyclerName} • ⭐ {item.recyclerRating?.toFixed(1) || "New"}
                        </p>
                        {item.status === 'scheduled' && item.scheduledDate && (
                          <p className="text-sm text-[var(--text-primary)] font-medium mt-2">
                            🗓️ Pickup: {new Date(item.scheduledDate).toLocaleDateString()} ({item.scheduledTimeSlot})
                          </p>
                        )}
                        {item.status === 'accepted' && (
                          <p className="text-sm text-[var(--text-primary)] font-medium mt-2">
                            🗓️ Awaiting Schedule
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.recyclerPhone && (
                          <>
                            <a
                              href={`tel:${item.recyclerPhone}`}
                              className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium hover:border-[var(--text-primary)] transition-colors"
                            >
                              📞 Call
                            </a>
                            <a
                              href={`https://wa.me/91${item.recyclerPhone.replace(/\D/g,'')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              WhatsApp
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
