"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

const CATEGORY_ICONS: Record<string, string> = {
  Plastic: "🥤",
  Paper: "📄",
  Metal: "🥫",
  Glass: "🍾",
  Organic: "🥬",
  Other: "♻️",
};

const TIPS: Record<string, string> = {
  Plastic: "Rinse plastic before recycling to increase reuse quality.",
  Paper: "Avoid glossy or laminated paper — they can't be recycled.",
  Metal: "Aluminum can be recycled infinitely without losing quality.",
  Glass: "Separate glass by color for better recycling efficiency.",
  Organic: "Compost organic waste to reduce methane emissions.",
  Other: "When in doubt, check your local waste disposal guidelines.",
};

type ScanResult = {
  category: string;
  confidence: number;
  co2: number;
  smartTip: string;
  tier: string;
  streak: number;
};

type ServerStatus = "checking" | "ready" | "waking" | "offline";

export default function ScanPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Wake up backend on mount
  useEffect(() => {
    const wakeServer = async () => {
      try {
        const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          setServerStatus("ready");
        } else {
          setServerStatus("waking");
          // Retry once after 5s
          setTimeout(async () => {
            try {
              const r2 = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(10000) });
              setServerStatus(r2.ok ? "ready" : "offline");
            } catch {
              setServerStatus("offline");
            }
          }, 5000);
        }
      } catch {
        setServerStatus("waking");
        // Backend is sleeping - retry after 10s
        const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        setTimeout(async () => {
          try {
            const r2 = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(15000) });
            setServerStatus(r2.ok ? "ready" : "offline");
          } catch {
            setServerStatus("offline");
          }
        }, 10000);
      }
    };
    wakeServer();
  }, []);

  const startProgressBar = () => {
    setScanProgress(0);
    let progress = 0;
    // Animate from 0 → 90% in ~800ms, then hold until done
    progressRef.current = setInterval(() => {
      progress += Math.random() * 18 + 12;
      if (progress >= 90) {
        progress = 90;
        if (progressRef.current) clearInterval(progressRef.current);
      }
      setScanProgress(Math.min(progress, 90));
    }, 100);
  };

  const finishProgressBar = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setScanProgress(100);
    setTimeout(() => setScanProgress(0), 400);
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPG, PNG, WEBP, etc.)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      setResult(null);
      setError(null);
      startProgressBar();

      const base64 = reader.result as string;
      setPreview(base64);

      // Try to get GPS coords (non-blocking, 3s timeout)
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        if ("geolocation" in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        }
      } catch {
        // GPS optional — continue without it
      }

      try {
        const data = await apiFetch("/waste/scan", {
          method: "POST",
          body: JSON.stringify({ image: base64, lat, lng }),
        });

        finishProgressBar();
        setResult(data);
      } catch (err: any) {
        finishProgressBar();
        console.error("Scan error:", err);
        setError(
          err?.message?.includes("Failed to connect")
            ? "Server is starting up — please wait 15 seconds and try again."
            : err?.message || "Scan failed. Please try again."
        );
        setPreview(null);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setResult(null);
    setPreview(null);
    setError(null);
    setScanProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto space-y-8 py-8 animate-fadeIn">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-3xl mb-2">
            📸
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Smart Waste Scanner
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Upload an image of your waste. Our AI will identify it in seconds and calculate your CO₂ savings.
          </p>
        </div>

        {/* Server status banner */}
        {serverStatus === "waking" && !loading && !result && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 text-sm text-amber-700 dark:text-amber-400">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Server is starting up (may take ~15 sec on first use)…</span>
          </div>
        )}

        {/* Progress bar */}
        {loading && (
          <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-400 mb-1">Scan Failed</p>
              <p className="text-sm text-red-700/80 dark:text-red-300/70">{error}</p>
            </div>
            <button
              onClick={handleReset}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Upload zone */}
        {!preview && !loading && !result && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mt-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-3xl p-12 text-center bg-neutral-50 dark:bg-[#1E293B]/50 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-all cursor-pointer group relative overflow-hidden"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-neutral-900 dark:text-white">Click to upload image</p>
                <p className="text-sm text-neutral-500 mt-1">JPG, PNG, WEBP supported</p>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✨ Results in ~1 second
              </p>
            </div>
          </div>
        )}

        {/* Scanning state */}
        {preview && loading && (
          <div className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg">
            <div className="relative aspect-square w-full bg-black/5 flex items-center justify-center">
              <img src={preview} alt="Scanning" className="object-contain w-full h-full opacity-50 blur-[2px]" />

              {/* Scanning laser */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-full h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] absolute animate-scanline" />
                <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay animate-pulse" />
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900/80 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                AI analyzing…
              </div>
            </div>
          </div>
        )}

        {/* Result state */}
        {result && preview && (
          <div className="grid md:grid-cols-2 gap-8 animate-fadeIn">
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <img src={preview} alt="Result" className="object-cover w-full h-full" />
              <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                ✓ Verified
              </div>
            </div>

            <div className="space-y-5 flex flex-col justify-center">
              {/* Main result card */}
              <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1E293B] shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Detected Material</p>
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">{result.category}</h2>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl">
                    {CATEGORY_ICONS[result.category] || "♻️"}
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">AI Confidence</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{result.confidence}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-5">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">CO₂ Avoided</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{result.co2} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Points Earned</p>
                    <p className="text-lg font-bold text-amber-500">+10 pts</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Your Tier</p>
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{result.tier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Streak</p>
                    <p className="text-sm font-semibold text-orange-500">🔥 {result.streak} days</p>
                  </div>
                </div>
              </div>

              {/* Smart tip */}
              <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-start gap-3">
                  <div className="text-xl mt-0.5">💡</div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Eco Tip</h3>
                    <p className="text-xs text-blue-800/80 dark:text-blue-300/70 leading-relaxed">
                      {result.smartTip || TIPS[result.category] || "Dispose responsibly and help the planet."}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl font-semibold hover:opacity-90 transition shadow-md"
              >
                Scan Another Item
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
