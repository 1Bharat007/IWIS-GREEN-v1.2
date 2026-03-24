"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

type Hotspot = {
  id: string;
  category: string;
  lat: number;
  lng: number;
  timestamp: string;
  co2: number;
};

// Heatmap colors based on category
const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case "plastic": return "#ef4444"; // Red
    case "metal": return "#64748b"; // Slate
    case "glass": return "#3b82f6"; // Blue
    case "organic": return "#10b981"; // Emerald
    case "paper": return "#f59e0b"; // Amber
    default: return "#8b5cf6"; // Purple
  }
};

export default function HotspotMap({ hotspots }: { hotspots: Hotspot[] }) {
  // Center roughly on India, or the first hotspot
  const center: [number, number] = hotspots.length > 0 
    ? [hotspots[0].lat, hotspots[0].lng] 
    : [20.5937, 78.9629]; // Default India

  return (
    <MapContainer 
      center={center} 
      zoom={5} 
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
      />
      
      {hotspots.map((spot) => (
        <CircleMarker
          key={spot.id}
          center={[spot.lat, spot.lng]}
          radius={8}
          pathOptions={{ 
            color: getCategoryColor(spot.category),
            fillColor: getCategoryColor(spot.category),
            fillOpacity: 0.6,
            weight: 2
          }}
        >
          <Popup>
            <div className="text-sm font-sans space-y-1">
              <p className="font-semibold text-base">{spot.category} Waste</p>
              <p className="text-gray-600">Avoided Impact: <span className="font-mono">{spot.co2} kg CO₂</span></p>
              <p className="text-gray-500 text-xs">{new Date(spot.timestamp).toLocaleString()}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
