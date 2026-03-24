"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

// Dynamic import for Leaflet (must be CSR)
const MapComponent = dynamic(
  () => import("@/components/map/HotspotMap"),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse">Initializing Geo-Spatial Engine...</div> }
);

export default function GeoMapPage() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const data = await apiFetch("/waste/hotspots");
        setHotspots(data || []);
      } catch (err) {
        console.error("Failed to load geographic data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMapData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto space-y-6 h-[80vh] flex flex-col">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Geo-tagged Hotspots</h1>
            <p className="text-neutral-500 mt-2">Live monitoring of illegal waste accumulation zones to optimize dispatch routes.</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-2 rounded-xl shadow-sm text-sm">
            <span className="font-semibold">{hotspots.length}</span> Active Points
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden bg-white dark:bg-neutral-900 p-2">
           {loading ? (
             <div className="w-full h-full flex items-center justify-center animate-pulse text-neutral-400">Loading mapping points...</div>
           ) : (
             <MapComponent hotspots={hotspots} />
           )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
