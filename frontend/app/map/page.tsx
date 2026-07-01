"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { MapPinIcon, FilterIcon } from "@/components/ui/Icons";

// Dynamic import for Leaflet (must be CSR)
const MapComponent = dynamic(
  () => import("@/components/map/HotspotMap"),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-[var(--surface-raised)]">
        <div className="flex items-center gap-2.5 text-sm text-[var(--text-tertiary)]">
          <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Initializing Geo-Spatial Engine…
        </div>
      </div>
    ) 
  }
);

export default function GeoMapPage() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const __data = await apiFetch("/waste/hotspots");
        const _data = __data.data || __data;
        const data = _data.data || _data;
        setHotspots(data || []);
      } catch (err) {
        console.error("Failed to load geographic data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMapData();
  }, []);

  const filteredHotspots = activeFilter === "All" 
    ? hotspots 
    : hotspots.filter((h: any) => h.category === activeFilter);

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)] animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-md bg-[var(--accent-subtle)] text-[var(--accent-text)] flex items-center justify-center">
                <MapPinIcon size={12} />
              </span>
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Geospatial Tracking
              </p>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">City Hotspots</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Feed
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs">
              <span className="font-semibold text-[var(--text-primary)]">{filteredHotspots.length}</span> 
              <span className="text-[var(--text-secondary)]">Active Points</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          <div className="flex items-center gap-1.5 pr-3 border-r border-[var(--border)] mr-1">
            <FilterIcon size={14} className="text-[var(--text-tertiary)]" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Filter:</span>
          </div>
          {["All", "Plastic", "Metal", "Glass", "Paper", "Organic", "Other"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                activeFilter === cat
                  ? "bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Map Container */}
        <div className="flex-1 rounded-xl border border-[var(--border)] shadow-sm overflow-hidden bg-[var(--surface)] relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-raised)]">
               <div className="flex items-center gap-2.5 text-sm text-[var(--text-tertiary)]">
                <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                Loading mapping points…
              </div>
            </div>
          ) : (
            <MapComponent hotspots={filteredHotspots} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
