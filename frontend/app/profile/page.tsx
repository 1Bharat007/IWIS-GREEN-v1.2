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
      <div className="flex justify-center p-20 animate-pulse text-emerald-600">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  const badges = [
    { earned: data.totalScans >= 1, icon: "🌱", title: "First Scan", desc: "Started the green journey", color: "from-emerald-400 to-emerald-600" },
    { earned: data.totalScans >= 10, icon: "♻️", title: "10 Scans", desc: "Recycling regular", color: "from-blue-400 to-blue-600" },
    { earned: data.totalScans >= 25, icon: "🌍", title: "25 Scans", desc: "Earth champion", color: "from-indigo-400 to-purple-600" },
    { earned: data.streak >= 5, icon: "🔥", title: "5 Day Streak", desc: "Consistency is key", color: "from-orange-400 to-red-600" },
    { earned: data.totalCO2 >= 10, icon: "☁️", title: "10kg CO₂ Saved", desc: "Carbon reducer", color: "from-cyan-400 to-cyan-600" },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn py-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Your Impact Profile
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">Track your environmental contributions and rewards.</p>
          </div>
        </div>

        {/* Eco Wallet */}
        <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-900 dark:to-teal-900 p-8 shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <p className="text-sm font-semibold text-emerald-50 dark:text-emerald-200 uppercase tracking-wide">
              Green Points Wallet
            </p>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-2">
              <div>
                <p className="text-5xl md:text-6xl font-bold text-white mt-1 drop-shadow-md">
                  {(data.greenPoints || 0).toLocaleString()} <span className="text-2xl font-medium text-emerald-100">GP</span>
                </p>
                <p className="text-sm text-emerald-100 mt-2">Redeem points with our verified sustainability partners.</p>
              </div>
              <button 
                onClick={() => alert("Reward Partner Ecosystem coming soon! (e.g. Metro Credits, Bill Discounts)")}
                className="px-8 py-4 bg-white text-emerald-700 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
              >
                Redeem Rewards
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Total Scans" value={data.totalScans} icon="📸" color="blue" />
          <StatCard title="Total CO₂ Impact" value={`${Number(data.totalCO2).toFixed(2)} kg`} icon="🌱" color="emerald" />
          <StatCard title="Daily Streak" value={`${data.streak} days`} icon="🔥" color="orange" />
          <StatCard title="Eco Tier" value={data.tier} icon="🏆" color="purple" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Achievements */}
          <div className="md:col-span-2 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1E293B] p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-neutral-900 dark:text-white">
              Badges & Achievements
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {badges.map((badge, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-2xl border transition-all ${badge.earned ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 shadow-sm' : 'border-neutral-100 dark:border-neutral-800/50 opacity-50 grayscale'}`}
                >
                  <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center text-2xl ${badge.earned ? `bg-gradient-to-br ${badge.color} text-white shadow-md` : 'bg-neutral-200 dark:bg-neutral-800'}`}>
                    {badge.icon}
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{badge.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1E293B] p-8 shadow-sm h-full flex flex-col">
            <h2 className="text-xl font-bold mb-6 text-neutral-900 dark:text-white">
              Recent Scans
            </h2>

            {data.history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 space-y-3">
                <span className="text-4xl">📭</span>
                <p>No scans yet.</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                {data.history.slice(0, 5).map((scan) => (
                  <div
                    key={scan.id}
                    className="flex justify-between items-center p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg">
                        {scan.category === 'Plastic' ? '🥤' : scan.category === 'Metal' ? '🥫' : scan.category === 'Glass' ? '🍾' : scan.category === 'Organic' ? '🥬' : '♻️'}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{scan.category}</p>
                        <p className="text-xs text-neutral-500">{new Date(scan.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">+{scan.co2}kg</p>
                      <p className="text-xs text-neutral-500">{Math.round(scan.confidence)}% conf.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {data.history.length > 5 && (
              <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 text-center">
                <a href="/history" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">View Full History →</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1E293B] p-6 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">
          {value}
        </p>
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {title}
        </p>
      </div>
    </div>
  );
}
