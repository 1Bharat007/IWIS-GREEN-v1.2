"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Link from "next/link";
import { AlertIcon, ArrowRightIcon, CheckCircleIcon, RefreshIcon, XIcon } from "@/components/ui/Icons";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

type Scan = {
  id:         string;
  category:   string;
  confidence: number;
  co2:        number;
  timestamp:  string;
};

type Toast = { type: "success" | "error"; message: string } | null;

const CATEGORY_COLORS: Record<string, string> = {
  Plastic: "bg-blue-50   text-blue-700  dark:bg-blue-900/20  dark:text-blue-300",
  Paper:   "bg-amber-50  text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  Metal:   "bg-zinc-100  text-zinc-700  dark:bg-zinc-800     dark:text-zinc-300",
  Glass:   "bg-cyan-50   text-cyan-700  dark:bg-cyan-900/20  dark:text-cyan-300",
  Organic: "bg-green-50  text-green-700 dark:bg-green-900/20 dark:text-green-300",
  Other:   "bg-[var(--surface-raised)] text-[var(--text-secondary)]",
};

export default function HistoryPage() {
  const [history,      setHistory]      = useState<Scan[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [toast,        setToast]        = useState<Toast>(null);
  // Modal state
  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalBatchId, setModalBatchId] = useState<string>("");
  const [priceRange,   setPriceRange]   = useState("20-100");
  const [listingLoading, setListingLoading] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    if (!getToken()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/waste/history");
      const arr = Array.isArray(res) ? res : res?.history ?? [];
      setHistory(arr);
    } catch (err: any) {
      setError(
        err?.message?.includes("Failed to connect")
          ? "Server is starting up. Please wait and retry."
          : "Failed to load history. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    history.forEach((s) => {
      const d = new Date(s.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      grouped[d] = (grouped[d] || 0) + s.co2;
    });
    return Object.entries(grouped).map(([date, co2]) => ({ date, co2: +co2.toFixed(2) }));
  }, [history]);

  const openListModal = (batchId: string) => {
    setModalBatchId(batchId);
    setPriceRange("20-100");
    setModalOpen(true);
  };

  const handleListSubmit = async () => {
    if (!priceRange.trim()) return;
    setListingLoading(true);
    try {
      await apiFetch("/marketplace/list", {
        method: "POST",
        body: JSON.stringify({ batchId: modalBatchId, priceRange }),
      });
      setModalOpen(false);
      showToast("success", "Item listed on the Circular Exchange.");
    } catch (err: any) {
      setModalOpen(false);
      showToast("error", err.message || "Failed to list item. It may already be listed.");
    } finally {
      setListingLoading(false);
    }
  };

  const fmt = (ts: string) =>
    new Date(ts).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <ProtectedRoute>
      <div className="space-y-6 animate-fadeIn">

        {/* ── Page header ──────────────────────────────────── */}
        <div className="border-b border-[var(--border)] pb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Activity Log
            </p>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Scan History</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              All classified waste items and your cumulative CO₂ impact.
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors shrink-0"
          >
            <RefreshIcon size={13} />
            Refresh
          </button>
        </div>

        {/* ── Toast ────────────────────────────────────────── */}
        {toast && (
          <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg border text-sm animate-fadeIn ${
            toast.type === "success"
              ? "border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent-text)]"
              : "border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-[var(--destructive)]"
          }`}>
            {toast.type === "success"
              ? <CheckCircleIcon size={14} />
              : <AlertIcon size={14} />}
            {toast.message}
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center gap-2.5 py-12 justify-center text-sm text-[var(--text-tertiary)]">
            <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            Loading history…
          </div>
        )}

        {/* ── Error ────────────────────────────────────────── */}
        {!loading && error && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
            <AlertIcon size={14} className="shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button onClick={load} className="text-xs font-medium underline hover:opacity-70 transition-opacity shrink-0">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── CO₂ Trend Chart ──────────────────────────── */}
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="mb-4">
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">
                  Over time
                </p>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">CO₂ Diversion Trend</h2>
              </div>
              {chartData.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">
                  No data yet. Start scanning to see your trend.
                </p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.8} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "var(--text-primary)",
                        }}
                        formatter={(v: any) => [`${v} kg`, "CO₂"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="co2"
                        stroke="var(--accent)"
                        strokeWidth={1.5}
                        dot={{ r: 2.5, fill: "var(--accent)", strokeWidth: 0 }}
                        activeDot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ── Scan list ────────────────────────────────── */}
            {history.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No scans yet</p>
                <p className="text-sm text-[var(--text-secondary)] mb-5">
                  Upload a waste image to classify it and start tracking your impact.
                </p>
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Open Scanner
                  <ArrowRightIcon size={13} />
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-raised)] text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  <div className="col-span-3">Category</div>
                  <div className="col-span-3 hidden sm:block">Date</div>
                  <div className="col-span-2 text-right">Confidence</div>
                  <div className="col-span-2 text-right">CO₂ Saved</div>
                  <div className="col-span-2 sm:col-span-2 text-right">Action</div>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {history.map((scan) => (
                    <div
                      key={`${scan.timestamp}-${scan.id}`}
                      className="grid grid-cols-12 items-center px-4 py-3 hover:bg-[var(--surface-raised)] transition-colors"
                    >
                      <div className="col-span-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          CATEGORY_COLORS[scan.category] ?? CATEGORY_COLORS.Other
                        }`}>
                          {scan.category}
                        </span>
                      </div>
                      <div className="col-span-3 hidden sm:block text-xs text-[var(--text-secondary)]">
                        {fmt(scan.timestamp)}
                      </div>
                      <div className="col-span-2 text-right text-xs font-medium text-[var(--text-primary)]">
                        {scan.confidence}%
                      </div>
                      <div className="col-span-2 text-right text-xs font-semibold text-[var(--accent-text)]">
                        +{scan.co2} kg
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button
                          onClick={() => openListModal(scan.id)}
                          className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline-offset-2 hover:underline"
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Listing Modal ─────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setModalOpen(false)}
          />
          {/* Panel */}
          <div className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-md animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                List on Circular Exchange
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
              >
                <XIcon size={13} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Enter your expected price range in ₹. Recyclers will place bids within this range.
              </p>
              <div>
                <label htmlFor="price-range" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Price range (₹)
                </label>
                <input
                  id="price-range"
                  type="text"
                  placeholder="e.g. 20-100"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-colors"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleListSubmit}
                disabled={listingLoading || !priceRange.trim()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {listingLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                List item
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
