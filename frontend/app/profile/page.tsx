"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

type Scan = {
  id: string;
  category: string;
  confidence: number;
  co2: number;
  timestamp: string;
};

type ProfileData = {
  history: Scan[];
  totalScans: number;
  totalCO2: number;
  streak: number;
  tier: string;
  greenPoints: number;
};

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!getToken()) return;
      try {
        const res = await apiFetch("/waste/history");
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-neutral-500">
        Loading profile...
      </div>
    );
  }

  if (!data) return null;

  const badges = [
    data.totalScans >= 1 && "🌱 First Scan",
    data.totalScans >= 10 && "♻️ 10 Scans",
    data.totalScans >= 25 && "🌍 25 Scans",
    data.streak >= 5 && "🔥 5 Day Streak",
  ].filter(Boolean);

  return (
    <ProtectedRoute>
      <div className="space-y-10 max-w-5xl mx-auto">
        <h1 className="text-4xl font-semibold tracking-tight">
          Your Impact Profile
        </h1>

      {/* Eco Wallet */}
      <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0f172a] dark:to-[#1e293b] p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-8xl opacity-10">💰</div>
        <div className="relative z-10">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
            Green Points Wallet
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-2">
            <div>
              <p className="text-5xl font-bold text-neutral-900 dark:text-white mt-1">
                {(data.greenPoints || 0).toLocaleString()} <span className="text-2xl font-normal text-emerald-600 dark:text-emerald-500">GP</span>
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">Earn points by scanning and tracing waste to MRFs.</p>
            </div>
            <button 
              onClick={() => alert("Reward Partner Ecosystem coming soon! (e.g. Metro Credits, Bill Discounts)")}
              className="px-6 py-3 bg-neutral-900 text-white rounded-xl dark:bg-white dark:text-black font-medium shadow-md hover:scale-105 transition-transform"
            >
              Redeem Rewards
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard title="Total Scans" value={data.totalScans} />
        <StatCard
          title="Total CO₂ Impact"
          value={`${Number(data.totalCO2).toFixed(2)} kg`}
        />
        <StatCard
          title="Daily Streak"
          value={`${data.streak} days`}
        />
        <StatCard title="Eco Tier" value={data.tier} />
      </div>

      {/* Achievements */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">
          Achievements
        </h2>

        {badges.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Start scanning to unlock achievements.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, index) => (
              <span
                key={index}
                className="px-4 py-2 text-sm rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">
          Recent Activity
        </h2>

        {data.history.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No scans yet.
          </p>
        ) : (
          <div className="space-y-3">
            {data.history.slice(0, 5).map((scan) => (
              <div
                key={scan.id}
                className="flex justify-between text-sm"
              >
                <span>{scan.category}</span>
                <span className="text-neutral-500">
                  {scan.co2} kg •{" "}
                  {new Date(scan.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({ title, value }: any) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
      <p className="text-sm text-neutral-500">
        {title}
      </p>
      <p className="text-2xl font-semibold mt-2">
        {value}
      </p>
    </div>
  );
}
