"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { UploadIcon, CheckIcon, AlertIcon, RefreshIcon } from "@/components/ui/Icons";

const CATEGORY_LABELS: Record<string, string> = {
  Plastic: "Plastic",
  Paper:   "Paper",
  Metal:   "Metal",
  Glass:   "Glass",
  Organic: "Organic",
  Other:   "Mixed / Other",
};

type ScanResult = {
  category:   string;
  confidence: number;
  co2:        number;
  smartTip:   string;
  tier:       string;
  streak:     number;
};

type ServerStatus = "checking" | "ready" | "waking" | "offline";

export default function ScanPage() {
  const [result,       setResult]       = useState<ScanResult | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [progress,     setProgress]     = useState(0);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef  = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const wakeServer = async () => {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      try {
        const r = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
        setServerStatus(r.ok ? "ready" : "waking");
        if (!r.ok) {
          setTimeout(async () => {
            try { const r2 = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(10000) });
              setServerStatus(r2.ok ? "ready" : "offline");
            } catch { setServerStatus("offline"); }
          }, 5000);
        }
      } catch {
        setServerStatus("waking");
        setTimeout(async () => {
          try { const r2 = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(15000) });
            setServerStatus(r2.ok ? "ready" : "offline");
          } catch { setServerStatus("offline"); }
        }, 10000);
      }
    };
    wakeServer();
  }, []);

  const startProgress = () => {
    setProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 15 + 8;
      if (p >= 88) { p = 88; if (progressRef.current) clearInterval(progressRef.current); }
      setProgress(Math.min(p, 88));
    }, 120);
  };

  const finishProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    setTimeout(() => setProgress(0), 500);
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      setResult(null);
      setError(null);
      startProgress();
      const base64 = reader.result as string;
      setPreview(base64);

      let lat: number | null = null, lng: number | null = null;
      try {
        if ("geolocation" in navigator) {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      } catch { /* GPS optional */ }

      try {
        const data = await apiFetch("/waste/scan", {
          method: "POST",
          body: JSON.stringify({ image: base64, lat, lng }),
        });
        finishProgress();
        setResult(data);
      } catch (err: any) {
        finishProgress();
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
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto space-y-6 py-2 animate-fadeIn">

        {/* ── Page header ──────────────────────────────────── */}
        <div className="border-b border-[var(--border)] pb-5">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            AI Classification
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Waste Scanner
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Upload an image to classify waste material and calculate your CO₂ savings.
          </p>
        </div>

        {/* Server status */}
        {serverStatus === "waking" && !loading && !result && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-[var(--warning-bg)] bg-[var(--warning-bg)] text-xs font-medium text-[var(--warning)]">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
            Backend is starting up — first scan may take ~15 seconds.
          </div>
        )}

        {/* Progress bar */}
        {loading && (
          <div className="h-0.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
            <AlertIcon size={14} className="shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button
              onClick={handleReset}
              className="text-xs font-medium underline shrink-0 hover:opacity-70 transition-opacity"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload zone */}
        {!preview && !loading && !result && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-[var(--border-strong)] rounded-xl p-12 text-center bg-[var(--surface)] hover:bg-[var(--surface-raised)] transition-colors cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
            <div className="w-10 h-10 mx-auto rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-center text-[var(--text-tertiary)] mb-4 group-hover:border-[var(--border-strong)] transition-colors">
              <UploadIcon size={16} />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
              Click to upload image
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">JPG, PNG, WEBP supported</p>
          </div>
        )}

        {/* Scanning state */}
        {preview && loading && (
          <div className="relative rounded-xl overflow-hidden border border-[var(--border)] aspect-video bg-[var(--surface-raised)]">
            <img src={preview} alt="Analyzing" className="object-contain w-full h-full opacity-40" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="w-full h-px bg-[var(--accent)] absolute animate-scanline opacity-80" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--text-primary)]">
                <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                Analyzing…
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && preview && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Image */}
              <div className="relative rounded-xl overflow-hidden border border-[var(--border)] aspect-square">
                <img src={preview} alt="Scanned" className="object-cover w-full h-full" />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--accent)] text-white text-xs font-medium">
                  <CheckIcon size={11} />
                  Verified
                </div>
              </div>

              {/* Data */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
                <div>
                  <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Detected Material
                  </p>
                  <p className="text-xl font-semibold text-[var(--text-primary)]">
                    {CATEGORY_LABELS[result.category] ?? result.category}
                  </p>
                </div>

                {/* Confidence bar */}
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1.5">
                    <span>AI Confidence</span>
                    <span className="font-medium text-[var(--text-primary)]">{result.confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] rounded-full transition-all duration-700"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border)]">
                  {[
                    { label: "CO₂ Avoided",   value: `+${result.co2} kg` },
                    { label: "Points Earned",  value: "+10 pts" },
                    { label: "Your Tier",      value: result.tier },
                    { label: "Streak",         value: `${result.streak} days` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-2xs text-[var(--text-tertiary)] mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Eco tip */}
            {result.smartTip && (
              <div className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-secondary)] leading-relaxed">
                <span className="font-medium text-[var(--text-primary)]">Eco tip — </span>
                {result.smartTip}
              </div>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            >
              <RefreshIcon size={13} />
              Scan another item
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
