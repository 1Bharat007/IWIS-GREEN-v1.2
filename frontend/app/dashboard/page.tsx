"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface WeeklyStat {
  category: string;
  count: number;
  totalCO2: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

export default function DashboardPage() {
  const [stats, setStats] = useState<WeeklyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!getToken()) return;
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

  // Equivalencies based on standard EPA metrics
  // 1 kg CO2 = ~2.48 miles driven by average gasoline-powered passenger vehicle (403g CO2/mile)
  const equivalentMiles = (totalCO2 * 2.48).toFixed(1);
  // ~21 kg CO2 absorbed per tree per year
  const equivalentTrees = (totalCO2 / 21).toFixed(2);
  // ~0.113 gallons of gasoline consumed per 1 kg CO2 
  const equivalentGas = (totalCO2 * 0.113).toFixed(2);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Category,Total Scans,Total CO2 Avoided (kg)\n";
    
    stats.forEach(stat => {
      csvContent += `${stat.category},${stat.count},${stat.totalCO2.toFixed(3)}\n`;
    });
    
    csvContent += `\nTOTAL,${totalScans},${totalCO2.toFixed(3)}`;
    csvContent += `\n\nEquivalency Metrics`;
    csvContent += `\nTree-Years of Absorption,${equivalentTrees}`;
    csvContent += `\nMiles Driven Avoided,${equivalentMiles}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IWIS_BRSR_ESG_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
              Carbon Accounting
            </h1>
            <p className="text-neutral-500 mt-2">Your ESG metrics and Scope 3 diversion tracking.</p>
          </div>
          <button 
            onClick={handleExportCSV}
            className="bg-black text-white dark:bg-white dark:text-black hover:opacity-80 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            <span>⬇️</span> BRSR / SEBI Export
          </button>
        </div>

        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#1E293B]">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Net CO₂ Diversion
            </p>
            <p className="mt-2 text-4xl font-semibold text-neutral-900 dark:text-white">
              {loading ? "..." : totalCO2.toFixed(2)} <span className="text-xl text-neutral-400 font-normal">kg CO₂e</span>
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#1E293B]">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Total Scans
            </p>
            <p className="mt-2 text-4xl font-semibold text-neutral-900 dark:text-white">
              {loading ? "..." : totalScans}
            </p>
          </div>
          
          <div className="rounded-2xl border border-neutral-200 bg-emerald-50 p-6 dark:border-neutral-800 dark:bg-emerald-900/10">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-500 uppercase tracking-wide">
              Trees Equivalent
            </p>
            <p className="mt-2 text-4xl font-semibold text-emerald-900 dark:text-emerald-400">
              🌲 {loading ? "..." : equivalentTrees}
            </p>
          </div>
        </div>

        {/* Equivalencies Section */}
        <div className="grid md:grid-cols-2 gap-6">
           <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex justify-between items-center text-sm text-neutral-600 dark:text-neutral-400">
              <span>🚗 Emissions Avoided</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{equivalentMiles} miles driven</span>
           </div>
           <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex justify-between items-center text-sm text-neutral-600 dark:text-neutral-400">
              <span>⛽ Fuel Saved</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{equivalentGas} gallons</span>
           </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie Chart: Composition */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#1E293B]">
            <h2 className="mb-6 text-lg font-medium text-neutral-900 dark:text-white">
              Material Footprint
            </h2>

            {stats.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-neutral-500">
                No data available.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats}
                      dataKey="totalCO2"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                    >
                      {stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => typeof val === 'number' ? `${val.toFixed(2)} kg` : val} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bar Chart: Distribution */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#1E293B]">
            <h2 className="mb-6 text-lg font-medium text-neutral-900 dark:text-white">
              Impact by Category
            </h2>

            {stats.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-neutral-500">
                No data available.
              </div>
            ) : (
              <div className="h-64 w-full text-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} width={80} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(val: any) => typeof val === 'number' ? `${val.toFixed(2)} kg` : val} />
                    <Bar dataKey="totalCO2" radius={[0, 4, 4, 0]}>
                      {stats.map((entry, index) => (
                        <Cell key={`cell-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
