"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Scan = {
  id: string;
  category: string;
  confidence: number;
  co2: number;
  timestamp: string;
};

const CATEGORY_ICONS: Record<string, string> = {
  Plastic: "🥤", Paper: "📄", Metal: "🥫", Glass: "🍾", Organic: "🥬", Other: "♻️",
};

export default function HistoryPage() {
  const [history, setHistory] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!getToken()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/waste/history");
      if (Array.isArray(res)) {
        setHistory(res);
      } else if (res?.history && Array.isArray(res.history)) {
        setHistory(res.history);
      } else {
        setHistory([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message?.includes("Failed to connect")
        ? "Server is starting up. Please wait a moment and retry."
        : "Failed to load history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Aggregate CO2 per day
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};

    history.forEach((scan) => {
      const date = new Date(scan.timestamp).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + scan.co2;
    });

    return Object.entries(grouped).map(([date, co2]) => ({
      date,
      co2: Number(co2.toFixed(2)),
    }));
  }, [history]);

  const handleListBatch = async (batchId: string) => {
    const priceRange = window.prompt("Enter your expected price range in ₹ (e.g., '10-50'):", "20-100");
    if (!priceRange) return;
    try {
      await apiFetch("/marketplace/list", {
        method: "POST",
        body: JSON.stringify({ batchId, priceRange })
      });
      alert("Waste successfully listed on the Circular Exchange!");
    } catch (err: any) {
      alert(err.message || "Failed to list item. It may already be listed.");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center p-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <p className="text-neutral-700 dark:text-neutral-300 font-medium">{error}</p>
          <button onClick={load} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition">
            Retry
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-10">
        <h1 className="text-3xl font-semibold">
        Scan History
      </h1>

      {/* ============================= */}
      {/* Chart Section */}
      {/* ============================= */}

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">
          CO₂ Trend
        </h2>

        {chartData.length === 0 ? (
          <div className="text-sm text-neutral-500">
            No scan data yet. Start scanning to see your impact trend.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="co2"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ============================= */}
      {/* Scan List */}
      {/* ============================= */}

        {history.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-neutral-500 mb-4">No scans yet. Start scanning your waste to see your history!</p>
            <Link href="/scan" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition">
              Go to Scanner →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((scan) => (
              <div
                key={`${scan.timestamp}-${scan.category}`}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[scan.category] || "♻️"}</span>
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-white">{scan.category}</span>
                      <p className="text-xs text-neutral-500 mt-0.5">{new Date(scan.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">+{scan.co2} kg CO₂</p>
                    <p className="text-xs text-neutral-500">{scan.confidence}% confidence</p>
                  </div>
                </div>

                <button
                  onClick={() => handleListBatch(scan.id)}
                  className="mt-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
                >
                  ♻️ Sell on Circular Exchange
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
