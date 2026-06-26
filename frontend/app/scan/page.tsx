"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { UploadIcon, CheckIcon, AlertIcon, RefreshIcon } from "@/components/ui/Icons";
import { useTasks } from "@/components/providers/TaskProvider";

const CATEGORY_LABELS: Record<string, string> = {
  Plastic: "Plastic",
  Paper:   "Paper",
  Metal:   "Metal",
  Glass:   "Glass",
  Organic: "Organic",
  Other:   "Mixed / Other",
};

// Staged loading messages — feel intelligent, not frozen
const SCAN_STAGES = [
  { label: "Uploading image…",              minProgress: 0  },
  { label: "Preprocessing visual data…",    minProgress: 18 },
  { label: "Running material analysis…",    minProgress: 36 },
  { label: "Calculating carbon impact…",    minProgress: 58 },
  { label: "Finalizing classification…",    minProgress: 80 },
];

type ScanResult = {
  category:      string;
  confidence:    number;
  co2:           number;
  smartTip:      string;
  alternatives?: { category: string; confidence: number }[];
  lowConfidence?: boolean;
  estimatedPricePerKg?: number | null;
};

type HistoryScan = {
  id: string;
  category: string;
  confidence: number;
  co2: number;
  timestamp: string;
  thumbnail: string | null;
  estimatedPricePerKg: number | null;
};

type ServerStatus = "checking" | "ready" | "waking" | "offline";

export default function ScanPage() {
  const { startTask, updateTaskProgress, completeTask, failTask, getTask, dismissTask } = useTasks();
  
  const scanTask = getTask("global_scan");
  
  const [result,       setResult]       = useState<ScanResult | null>(null);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [progress,     setProgress]     = useState(0);
  const [stageIdx,     setStageIdx]     = useState(0);
  const [isDragging,   setIsDragging]   = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");
  const [recentScans,  setRecentScans]  = useState<HistoryScan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef  = useRef<NodeJS.Timeout | null>(null);
  const stageRef     = useRef<NodeJS.Timeout | null>(null);

  const loading = scanTask?.status === "running";

  // Sync global task state to local component state on mount/update
  useEffect(() => {
    if (scanTask) {
      if (scanTask.status === "success" && scanTask.payload) {
        setResult(scanTask.payload);
        setPreview(scanTask.payload.preview || null); // Recover image from payload if available
      } else if (scanTask.status === "error" && scanTask.error) {
        setError(scanTask.error);
      }
    }
  }, [scanTask?.status, scanTask?.payload, scanTask?.error]);

  useEffect(() => {
    const wakeServer = async () => {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      try {
        const r = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
        setServerStatus(r.ok ? "ready" : "waking");
        if (!r.ok) {
          setTimeout(async () => {
            try {
              const r2 = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(10000) });
              setServerStatus(r2.ok ? "ready" : "offline");
            } catch { setServerStatus("offline"); }
          }, 5000);
        }
      } catch {
        setServerStatus("waking");
        setTimeout(async () => {
          try {
            const r2 = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(15000) });
            setServerStatus(r2.ok ? "ready" : "offline");
          } catch { setServerStatus("offline"); }
        }, 10000);
      }
    };
    wakeServer();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await apiFetch("/waste/history?limit=10");
        setRecentScans(data.history || []);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const startProgress = () => {
    setProgress(0);
    setStageIdx(0);
    let p = 0;
    let s = 0;

    progressRef.current = setInterval(() => {
      p += Math.random() * 6 + 3;
      if (p >= 88) { p = 88; if (progressRef.current) clearInterval(progressRef.current); }
      setProgress(Math.min(p, 88));

      // Advance stage based on progress
      const nextStage = SCAN_STAGES.findIndex((st, i) => i > s && p >= st.minProgress);
      if (nextStage !== -1) { 
        s = nextStage; 
        setStageIdx(s); 
        updateTaskProgress("global_scan", SCAN_STAGES[s].label, Math.min(p, 88));
      } else {
        updateTaskProgress("global_scan", SCAN_STAGES[s].label, Math.min(p, 88));
      }
    }, 200);
  };

  const finishProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (stageRef.current)    clearInterval(stageRef.current);
    setProgress(100);
    setStageIdx(SCAN_STAGES.length - 1);
    updateTaskProgress("global_scan", "Complete", 100);
    setTimeout(() => setProgress(0), 600);
  };

  const compressImage = (file: File): Promise<{ base64: string, thumbnail: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const max_size = 1000;

          if (width > height && width > max_size) {
            height *= max_size / width;
            width = max_size;
          } else if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL("image/jpeg", 0.7);

          // Generate Thumbnail
          const thumbCanvas = document.createElement("canvas");
          let thumbW = img.width;
          let thumbH = img.height;
          const thumbMax = 200;
          if (thumbW > thumbH && thumbW > thumbMax) {
            thumbH *= thumbMax / thumbW;
            thumbW = thumbMax;
          } else if (thumbH > thumbMax) {
            thumbW *= thumbMax / thumbH;
            thumbH = thumbMax;
          }
          thumbCanvas.width = thumbW;
          thumbCanvas.height = thumbH;
          const thumbCtx = thumbCanvas.getContext("2d");
          thumbCtx?.drawImage(img, 0, 0, thumbW, thumbH);
          const thumbnail = thumbCanvas.toDataURL("image/webp", 0.5);

          resolve({ base64, thumbnail });
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }
    
    try {
      setResult(null);
      setError(null);
      startTask("global_scan", "scan", "AI Waste Scan");
      startProgress();
      
      const { base64, thumbnail } = await compressImage(file);
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
          body: JSON.stringify({ image: base64, thumbnail, lat, lng }),
        });
        finishProgress();
        // Stash the preview image inside the payload so we can recover it if returning from another page
        completeTask("global_scan", { ...data, preview: base64 });

        // Prepend to history locally
        setRecentScans(prev => [{
          id: Math.random().toString(), // local temporary id
          category: data.category,
          confidence: data.confidence,
          co2: data.co2,
          timestamp: new Date().toISOString(),
          thumbnail: thumbnail,
          estimatedPricePerKg: data.estimatedPricePerKg
        }, ...prev]);
      } catch (err: any) {
        finishProgress();
        const msg = err instanceof ApiError
          ? err.backendMessage
          : err?.message?.includes("Failed to fetch")
            ? "Server is starting up — please wait 15 seconds and try again."
            : err?.message || "Scan failed. Please try again.";
        failTask("global_scan", msg);
        setPreview(null);
      }
    } catch (err) {
      setError("Failed to compress image.");
      finishProgress();
      failTask("global_scan", "Image processing failed.");
    }
  };

  const handleReset = () => {
    setResult(null);
    setPreview(null);
    setError(null);
    setProgress(0);
    setStageIdx(0);
    dismissTask("global_scan");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Drag-and-drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, []);

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
            Upload or drag an image to classify waste material and calculate your CO₂ savings.
          </p>
        </div>

        {/* Server status */}
        {serverStatus === "waking" && !loading && !result && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-[var(--warning-bg)] bg-[var(--warning-bg)] text-xs font-medium text-[var(--warning)]">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
            Backend is starting up — first scan may take ~15 seconds.
          </div>
        )}

        {/* Progress bar + staged message */}
        {loading && (
          <div className="space-y-2">
            <div className="h-0.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-tertiary)] text-center animate-fadeIn" key={stageIdx}>
              {SCAN_STAGES[stageIdx]?.label}
            </p>
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

        {/* Upload / Drag zone */}
        {!preview && !loading && !result && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer group ${
              isDragging
                ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                : "border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
            <div className={`w-10 h-10 mx-auto rounded-lg border flex items-center justify-center mb-4 transition-colors ${
              isDragging
                ? "border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent-text)]"
                : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-tertiary)] group-hover:border-[var(--border-strong)]"
            }`}>
              <UploadIcon size={16} />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
              {isDragging ? "Drop image here" : "Click to upload or drag & drop"}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">JPG, PNG, WEBP — up to 20 MB</p>
          </div>
        )}

        {/* Scanning state with staged overlay */}
        {preview && loading && (
          <div className="relative rounded-xl overflow-hidden border border-[var(--border)] aspect-video bg-[var(--surface-raised)]">
            <img src={preview} alt="Analyzing" className="object-contain w-full h-full opacity-30" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="w-full h-px bg-[var(--accent)] absolute animate-scanline opacity-70" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] shadow-sm">
                <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
                {SCAN_STAGES[stageIdx]?.label}
              </div>
              <div className="w-48 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
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
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)]">
                  <CheckIcon size={11} className="text-[var(--accent)]" />
                  Classified
                </div>
              </div>

              {/* Data */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
                
                {/* 1. Estimated Value */}
                <div className="p-3 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-border)]">
                  <p className="text-2xs font-semibold text-[var(--accent-text)] uppercase tracking-wider mb-1">
                    Estimated Value
                  </p>
                  {result.estimatedPricePerKg != null ? (
                    <p className="text-xl font-bold text-[var(--accent-text)]">
                      ₹{result.estimatedPricePerKg}/kg
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      Current market price unavailable.
                    </p>
                  )}
                </div>

                {/* 2. Material Type */}
                <div>
                  <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Detected Material
                  </p>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    {CATEGORY_LABELS[result.category] ?? result.category}
                  </p>
                </div>

                {/* 3. Confidence — with trust tier */}
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1.5">
                    <span>AI Confidence</span>
                    <span className={`font-semibold ${
                      result.confidence >= 85 ? "text-[var(--accent-text)]"
                      : result.confidence >= 70 ? "text-[var(--warning)]"
                      : "text-[var(--destructive)]"
                    }`}>
                      {result.confidence}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        result.confidence >= 85 ? "bg-[var(--accent)]"
                        : result.confidence >= 70 ? "bg-[var(--warning)]"
                        : "bg-[var(--destructive)]"
                      }`}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  {result.lowConfidence && (
                    <p className="mt-1.5 text-2xs text-[var(--warning)]">
                      ⚠ Low confidence — result may be inaccurate. Consider rescanning with better lighting.
                    </p>
                  )}
                </div>

                {/* Alternatives */}
                {result.alternatives && result.alternatives.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                      Alternative classifications
                    </p>
                    <div className="space-y-1.5">
                      {result.alternatives.map((alt) => (
                        <div key={alt.category} className="flex items-center justify-between">
                          <span className="text-xs text-[var(--text-secondary)]">
                            {CATEGORY_LABELS[alt.category] ?? alt.category}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">{alt.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Environmental Impact Metrics */}
                <div className="grid grid-cols-1 gap-3 pt-3 border-t border-[var(--border)]">
                  {[
                    { label: "CO₂ Avoided",  value: `+${result.co2} kg` },
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

            <div className="grid grid-cols-2 gap-3">
              <a
                href={`/sell?material=${result.category}`}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Create Listing
              </a>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              >
                <RefreshIcon size={13} />
                Scan another item
              </button>
            </div>
          </div>
        )}
        {/* ── Recent Scans Workspace ───────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-[var(--border)] animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Scans</h2>
            {recentScans.length > 0 && (
              <span className="text-xs font-medium text-[var(--text-tertiary)] bg-[var(--surface-raised)] px-2 py-1 rounded-md">
                {recentScans.length} recent
              </span>
            )}
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center p-8">
              <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentScans.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--text-tertiary)] text-sm">
              No recent scans. Your history will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors">
                  <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg overflow-hidden flex items-center justify-center">
                    {scan.thumbnail ? (
                      <img src={scan.thumbnail} alt={scan.category} className="w-full h-full object-cover" />
                    ) : (
                      <CheckIcon size={20} className="text-[var(--text-tertiary)] opacity-30" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {CATEGORY_LABELS[scan.category] ?? scan.category}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {new Date(scan.timestamp).toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "numeric", minute: "numeric"
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-[var(--accent-text)]">
                          {scan.estimatedPricePerKg != null ? `₹${scan.estimatedPricePerKg}/kg` : "---"}
                        </span>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {scan.confidence}% sure
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={`/sell?material=${scan.category}`}
                        className="text-xs font-medium bg-[var(--accent)] text-white px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                      >
                        Create Listing
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </ProtectedRoute>
  );
}
