"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { ArrowRightIcon } from "@/components/ui/Icons";

type Listing = {
  id: string;
  materialType: string;
  estimatedWeightKg: number;
  status: string;
  createdAt: string;
  pickupAddress: string;
};

export default function SellHistoryPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/listings/my")
      .then((data) => setListings(data))
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
              You haven't posted any waste for pickup yet. Create your first listing to start earning.
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
            {listings.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-border)] transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {item.materialType} <span className="text-[var(--text-tertiary)] font-normal ml-1">({item.estimatedWeightKg} kg)</span>
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Posted on {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border uppercase tracking-wider ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="text-sm text-[var(--text-secondary)] bg-[var(--surface-raised)] p-3 rounded-lg">
                  <span className="font-medium text-[var(--text-primary)]">Pickup at:</span> {item.pickupAddress}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
