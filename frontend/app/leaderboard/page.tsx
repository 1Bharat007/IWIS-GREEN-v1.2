"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

interface LeaderboardUser {
  email: string;
  totalCO2: number;
  totalScans: number;
  tier: string;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaders = async () => {
      try {
        const data = await apiFetch("/waste/leaderboard");
        setLeaders(data);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLeaders();
  }, []);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Gold": return "🥇";
      case "Silver": return "🥈";
      case "Bronze": return "🥉";
      default: return "🌱";
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Community <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Leaderboard</span>
          </h1>
          <p className="text-neutral-500 max-w-xl mx-auto">
            See who's making the biggest impact. Compete with your neighbors to reduce the most CO₂ and earn Green Points.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Podium (If we have at least 3 users) */}
            {leaders.length >= 3 && (
              <div className="flex flex-col md:flex-row justify-center items-end gap-4 mb-16 pt-8">
                {/* 2nd Place */}
                <div className="order-2 md:order-1 flex flex-col items-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-3xl mb-4 border-4 border-neutral-300 dark:border-neutral-600 shadow-lg relative">
                    🥈
                    <div className="absolute -bottom-2 -right-2 bg-neutral-900 text-white dark:bg-white dark:text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">2</div>
                  </div>
                  <p className="font-semibold text-neutral-900 dark:text-white truncate w-32 text-center">{leaders[1].email.split('@')[0]}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{leaders[1].totalCO2.toFixed(1)} kg</p>
                  <div className="w-24 h-24 md:h-32 bg-gradient-to-t from-neutral-200 to-white/50 dark:from-neutral-800 dark:to-neutral-900/50 mt-4 rounded-t-xl" />
                </div>

                {/* 1st Place */}
                <div className="order-1 md:order-2 flex flex-col items-center animate-fadeIn z-10" style={{ animationDelay: '0.1s' }}>
                  <div className="text-4xl animate-float mb-2">👑</div>
                  <div className="w-28 h-28 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-4xl mb-4 border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)] relative">
                    🥇
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">1</div>
                  </div>
                  <p className="font-bold text-lg text-neutral-900 dark:text-white truncate w-40 text-center">{leaders[0].email.split('@')[0]}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{leaders[0].totalCO2.toFixed(1)} kg CO₂</p>
                  <div className="w-32 h-32 md:h-44 bg-gradient-to-t from-yellow-100 to-white/50 dark:from-yellow-900/20 dark:to-neutral-900/50 mt-4 rounded-t-xl" />
                </div>

                {/* 3rd Place */}
                <div className="order-3 flex flex-col items-center animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                  <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-3xl mb-4 border-4 border-orange-300 dark:border-orange-800 shadow-lg relative">
                    🥉
                    <div className="absolute -bottom-2 -right-2 bg-orange-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">3</div>
                  </div>
                  <p className="font-semibold text-neutral-900 dark:text-white truncate w-32 text-center">{leaders[2].email.split('@')[0]}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{leaders[2].totalCO2.toFixed(1)} kg</p>
                  <div className="w-24 h-20 md:h-24 bg-gradient-to-t from-orange-100 to-white/50 dark:from-orange-900/20 dark:to-neutral-900/50 mt-4 rounded-t-xl" />
                </div>
              </div>
            )}

            {/* List for everyone else (or all if < 3) */}
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0F172A] grid grid-cols-12 text-sm font-medium text-neutral-500 uppercase tracking-wide">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-6">Eco-Warrior</div>
                <div className="col-span-2 text-center hidden sm:block">Scans</div>
                <div className="col-span-4 sm:col-span-2 text-right">CO₂ Saved</div>
              </div>
              
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {leaders.map((leader, index) => (
                  <div 
                    key={index} 
                    className="px-6 py-4 grid grid-cols-12 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors animate-fadeIn"
                    style={{ animationDelay: \`\${0.1 * index}s\` }}
                  >
                    <div className="col-span-2 text-center font-medium text-neutral-400">
                      #{index + 1}
                    </div>
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg">
                        {getTierIcon(leader.tier)}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900 dark:text-white truncate max-w-[120px] sm:max-w-[200px]">
                          {leader.email.split('@')[0]}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {leader.tier}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center hidden sm:block text-neutral-600 dark:text-neutral-300">
                      {leader.totalScans}
                    </div>
                    <div className="col-span-4 sm:col-span-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {leader.totalCO2.toFixed(1)} <span className="text-xs">kg</span>
                    </div>
                  </div>
                ))}
                
                {leaders.length === 0 && (
                  <div className="p-8 text-center text-neutral-500">
                    No environmental leaders yet. Be the first to start scanning!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
