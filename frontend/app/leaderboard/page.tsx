"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { tierConfig } from "@/components/ui/Icons";

interface LeaderboardUser {
  email:       string;
  totalCO2:    number;
  totalScans:  number;
  tier:        string;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/waste/leaderboard")
      .then((d) => setLeaders(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const medal = (i: number) => {
    if (i === 0) return <span className="text-xs font-bold text-amber-600">#1</span>;
    if (i === 1) return <span className="text-xs font-bold text-zinc-500">#2</span>;
    if (i === 2) return <span className="text-xs font-bold text-orange-600">#3</span>;
    return <span className="text-xs text-[var(--text-tertiary)]">#{i + 1}</span>;
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">

        {/* ── Page header ──────────────────────────────────── */}
        <div className="border-b border-[var(--border)] pb-5">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            Community
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Impact Rankings
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Users ranked by total CO₂ diverted from landfill. Updated in real time.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-16 text-sm text-[var(--text-tertiary)]">
            <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            Loading rankings…
          </div>
        ) : leaders.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No rankings yet</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Be the first to scan waste and claim the top spot.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">

            {/* Table header */}
            <div className="grid grid-cols-12 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-raised)] text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5 pl-3">User</div>
              <div className="col-span-2 text-center hidden sm:block">Tier</div>
              <div className="col-span-2 text-right hidden sm:block">Scans</div>
              <div className="col-span-4 sm:col-span-2 text-right">CO₂ Saved</div>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {leaders.map((leader, i) => {
                const tier = tierConfig(leader.tier);
                const handle = leader.email.split("@")[0];
                const isTop3 = i < 3;
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-12 items-center px-4 py-3 transition-colors ${
                      isTop3 ? "hover:bg-[var(--surface-raised)]" : "hover:bg-[var(--surface-raised)]"
                    } ${i === 0 ? "bg-amber-50/50 dark:bg-amber-900/5" : ""}`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex justify-center">
                      {medal(i)}
                    </div>

                    {/* User */}
                    <div className="col-span-5 pl-3 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          {handle[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-[200px]">
                        {handle}
                      </span>
                    </div>

                    {/* Tier badge */}
                    <div className="col-span-2 hidden sm:flex justify-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${tier.className}`}>
                        {tier.label}
                      </span>
                    </div>

                    {/* Scans */}
                    <div className="col-span-2 text-right text-xs text-[var(--text-secondary)] hidden sm:block">
                      {leader.totalScans}
                    </div>

                    {/* CO₂ */}
                    <div className="col-span-4 sm:col-span-2 text-right text-sm font-semibold text-[var(--accent-text)]">
                      {leader.totalCO2.toFixed(1)}
                      <span className="text-xs font-normal text-[var(--text-tertiary)] ml-0.5">kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--text-tertiary)]">
          CO₂ figures represent total waste diverted and classified through the IWIS platform.
        </p>
      </div>
    </ProtectedRoute>
  );
}
