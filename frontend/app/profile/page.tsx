"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { CheckIcon, ScanIcon, LeafIcon, TrophyIcon, TrendUpIcon, ArrowRightIcon } from "@/components/ui/Icons";
import Link from "next/link";

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

const CATEGORY_COLORS: Record<string, string> = {
  Plastic: "bg-[var(--info-bg)] text-[var(--info)]",
  Paper:   "bg-[var(--warning-bg)] text-[var(--warning)]",
  Metal:   "bg-[var(--surface-raised)] text-[var(--text-secondary)]",
  Glass:   "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300",
  Organic: "bg-[var(--accent-subtle)] text-[var(--accent-text)]",
  Other:   "bg-[var(--surface-raised)] text-[var(--text-secondary)]",
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
      <ProtectedRoute>
        <div className="flex items-center gap-2.5 py-12 justify-center text-sm text-[var(--text-tertiary)]">
          <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Loading profile…
        </div>
      </ProtectedRoute>
    );
  }

  if (!data) return null;

  const badges = [
    { earned: data.totalScans >= 1,  title: "First Scan", desc: "Started the green journey" },
    { earned: data.totalScans >= 10, title: "10 Scans",   desc: "Recycling regular" },
    { earned: data.totalScans >= 25, title: "25 Scans",   desc: "Earth champion" },
    { earned: data.streak >= 5,      title: "5 Day Streak", desc: "Consistency is key" },
    { earned: data.totalCO2 >= 10,   title: "10kg CO₂ Saved", desc: "Carbon reducer" },
  ];

  const fmtDate = (ts: string) =>
    new Date(ts).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto space-y-6 py-2 animate-fadeIn">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-5">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            Impact Dashboard
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Your Profile</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track your environmental contributions, badges, and Green Points.
          </p>
        </div>

        {/* Eco Wallet Banner */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--accent-border)] bg-[var(--accent-subtle)] p-6">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider mb-2">
                Green Points Wallet
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-[var(--text-primary)]">
                  {(data.greenPoints || 0).toLocaleString()}
                </span>
                <span className="text-sm font-medium text-[var(--text-secondary)]">GP</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-sm leading-relaxed">
                Earn 10 points for every verified waste scan. Use points to redeem rewards from sustainability partners.
              </p>
            </div>
            
            <div className="shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 text-center w-full md:w-auto">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Reward Partners</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-2xs font-medium bg-[var(--surface-raised)] text-[var(--text-tertiary)] border border-[var(--border)]">
                Coming Soon in Q3
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: "Total Scans", value: data.totalScans, icon: ScanIcon, accent: false },
            { title: "CO₂ Impact",  value: `${Number(data.totalCO2).toFixed(2)} kg`, icon: LeafIcon, accent: true },
            { title: "Daily Streak", value: `${data.streak} days`, icon: TrendUpIcon, accent: false },
            { title: "Eco Tier",    value: data.tier, icon: TrophyIcon, accent: false },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-[var(--text-secondary)]">{stat.title}</p>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  stat.accent 
                    ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]" 
                    : "bg-[var(--surface-raised)] text-[var(--text-tertiary)]"
                }`}>
                  <stat.icon size={12} />
                </div>
              </div>
              <p className={`text-xl font-semibold ${stat.accent ? "text-[var(--accent-text)]" : "text-[var(--text-primary)]"}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Achievements */}
          <div className="md:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Badges & Achievements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((badge, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border transition-colors ${
                    badge.earned 
                      ? "border-[var(--accent-border)] bg-[var(--surface)]" 
                      : "border-[var(--border)] bg-[var(--surface-raised)] opacity-60"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md mb-2 flex items-center justify-center ${
                    badge.earned 
                      ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]" 
                      : "bg-[var(--border)] text-[var(--text-tertiary)]"
                  }`}>
                    <TrophyIcon size={14} />
                  </div>
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-0.5">{badge.title}</h3>
                  <p className="text-2xs text-[var(--text-tertiary)] leading-tight">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Scans Mini-List */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent Scans</h2>
            
            {data.history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <p className="text-sm text-[var(--text-secondary)]">No scans yet.</p>
                <Link href="/scan" className="text-xs text-[var(--accent-text)] mt-2 hover:underline">
                  Start scanning →
                </Link>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {data.history.slice(0, 4).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${
                        scan.category === "Plastic" ? "bg-[var(--info)]"
                        : scan.category === "Paper" ? "bg-[var(--warning)]"
                        : scan.category === "Organic" ? "bg-[var(--accent)]"
                        : "bg-[var(--text-tertiary)]"
                      }`} />
                      <div>
                        <p className="text-xs font-medium text-[var(--text-primary)]">{scan.category}</p>
                        <p className="text-2xs text-[var(--text-tertiary)]">{fmtDate(scan.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[var(--accent-text)]">+{scan.co2}kg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.history.length > 4 && (
              <Link 
                href="/history" 
                className="mt-4 pt-3 border-t border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors"
              >
                View full history
                <ArrowRightIcon size={11} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
