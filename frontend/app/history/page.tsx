"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
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

export default function HistoryPage() {
  const [history, setHistory] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/waste/history");

        // Support both array and object response
        if (Array.isArray(res)) {
          setHistory(res);
        } else if (res?.history && Array.isArray(res.history)) {
          setHistory(res.history);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error(err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

  if (loading) {
    return (
      <div className="text-sm text-neutral-500">
        Loading history...
      </div>
    );
  }

  return (
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
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-sm text-neutral-500">
          You haven’t scanned anything yet.
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((scan) => (
            <div
              key={`${scan.timestamp}-${scan.category}`}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between">
                <span className="font-medium">
                  {scan.category}
                </span>
                <span className="text-sm text-neutral-500">
                  {new Date(scan.timestamp).toLocaleDateString()}
                </span>
              </div>

              <div className="text-sm text-neutral-500 mt-2">
                Confidence: {scan.confidence}% • CO₂: {scan.co2} kg
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
