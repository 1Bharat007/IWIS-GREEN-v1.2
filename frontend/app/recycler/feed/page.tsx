"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { demoRecyclerFeed } from "@/lib/demo/feed";

import { useRouter } from "next/navigation";

type Listing = {
  id: string;
  citizenName?: string;
  materialType: string;
  wasteVolume?: string;
  estimatedWeightKg?: number;
  pickupAddress: string;
  description?: string;
  createdAt: string;
  distanceKm?: string;
};

export default function RecyclerFeedPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  const fetchListings = () => {
    setLoading(true);
    apiFetch("/listings/nearby?lat=32.7266&lng=74.8570&radiusKm=20")
      .then((data) => {
        if (data.length === 0 && process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
          setListings(demoRecyclerFeed);
        } else {
          setListings(data);
        }
      })
      .catch((err) => setError(err.message || "Failed to load feed."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // For MVP, we simulate sending the recycler's Jammu coordinates
    fetchListings();
    
    if (sessionStorage.getItem("justLoggedIn")) {
      setShowWelcomeBanner(true);
      sessionStorage.removeItem("justLoggedIn");
      setTimeout(() => setShowWelcomeBanner(false), 5000);
    }
  }, []);

  const handleAccept = async (id: string) => {
    try {
      setAcceptingId(id);
      setError("");
      await apiFetch(`/listings/${id}/accept`, { method: "POST" });
      
      // Remove it from the feed since it's no longer 'listed'
      setListings((prev) => prev.filter((l) => l.id !== id));
      
      // Redirect to scheduling page
      router.push(`/recycler/pickup/${id}`);
    } catch (err: any) {
      if (err.statusCode === 409) {
        setError("This listing was just accepted by another recycler. We've refreshed your nearby listings.");
        fetchListings();
      } else {
        setError(err.backendMessage || err.message || "Failed to accept listing.");
      }
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 animate-fadeIn relative">
        
        {/* Subtle Welcome Banner */}
        {showWelcomeBanner && (
          <div className="absolute top-0 left-0 right-0 -mt-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-500 z-10">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[var(--accent)] text-white text-sm font-medium rounded-xl shadow-lg shadow-[var(--accent)]/20">
              <span className="text-lg">✅</span>
              <span>Authentication successful. Welcome to your workspace!</span>
            </div>
          </div>
        )}

        <div className="mb-8 mt-2">
          <p className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider mb-1">
            Recycler Action
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Nearby Waste Feed
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Available bulk waste listings in your service area. Claim them before other recyclers do.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--text-tertiary)]">
            <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mr-2" />
            Scanning for nearby waste...
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <div className="w-16 h-16 bg-[var(--surface-raised)] border border-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl opacity-80">🌍</span>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No active listings</h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
              There is currently no bulk waste listed in your immediate service area. We'll notify you when new pickups become available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {listings.map((item, index) => (
              <div 
                key={item.id} 
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-border)] transition-colors flex flex-col h-full shadow-sm animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-lg">
                      {item.materialType} 
                      <span className="text-[var(--text-secondary)] font-normal text-sm ml-2">
                        {item.wasteVolume || "Medium Bag"} 
                        {item.estimatedWeightKg ? ` (${item.estimatedWeightKg} kg)` : ""}
                      </span>
                    </h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      Listed by {item.citizenName || "Citizen"} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {item.distanceKm && (
                    <span className="bg-[var(--surface-raised)] px-2.5 py-1 rounded-md text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border)] whitespace-nowrap">
                      {item.distanceKm} km away
                    </span>
                  )}
                </div>

                <div className="text-sm text-[var(--text-secondary)] mb-4 flex-1">
                  <p className="font-medium text-[var(--text-primary)] mb-1">Collection Address:</p>
                  <p className="line-clamp-2">{item.pickupAddress}</p>
                  {item.description && (
                    <p className="mt-2 text-xs italic opacity-80">"{item.description}"</p>
                  )}
                </div>

                <button
                  disabled={acceptingId === item.id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  onClick={() => handleAccept(item.id)}
                >
                  {acceptingId === item.id ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin" />
                      Confirming...
                    </span>
                  ) : (
                    <>
                      Accept Collection
                      <ArrowRightIcon size={14} />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
