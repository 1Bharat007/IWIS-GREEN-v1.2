"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

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
};

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold">
        Your Impact Profile
      </h1>

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
