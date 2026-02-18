"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

interface WeeklyStat {
  category: string;
  count: number;
  totalCO2: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<WeeklyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch("/waste/stats");
        setStats(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalCO2 = stats.reduce((acc, s) => acc + (s.totalCO2 || 0), 0);
  const totalScans = stats.reduce((acc, s) => acc + (s.count || 0), 0);

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Dashboard
        </h1>

        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Weekly CO₂ Impact
            </p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900 dark:text-white">
              {loading ? "..." : totalCO2.toFixed(2)} kg
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Weekly Scans
            </p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900 dark:text-white">
              {loading ? "..." : totalScans}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-white">
            Weekly Category Breakdown
          </h2>

          {stats.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No scans this week.
            </p>
          )}

          {stats.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between border-b border-neutral-200 py-3 text-sm last:border-none dark:border-neutral-700"
            >
              <span className="text-neutral-700 dark:text-neutral-300">
                {item.category}
              </span>
              <span className="font-medium text-neutral-900 dark:text-white">
                {(item.totalCO2 || 0).toFixed(2)} kg
              </span>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
