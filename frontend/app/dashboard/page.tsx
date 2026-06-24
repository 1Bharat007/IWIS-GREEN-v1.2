"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/session";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { DownloadIcon, BarChartIcon, TrendUpIcon, LeafIcon, CO2Icon } from "@/components/ui/Icons";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface WeeklyStat {
  category: string;
  count: number;
  totalCO2: number;
}

// Semantic, accessible color palette — not random
const CHART_COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#64748b"];

export default function DashboardPage() {
  const [stats,   setStats]   = useState<WeeklyStat[]>([]);
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

  const totalCO2   = stats.reduce((a, s) => a + (s.totalCO2 || 0), 0);
  const totalScans = stats.reduce((a, s) => a + (s.count    || 0), 0);
  const treesEq    = (totalCO2 / 21).toFixed(2);
  const kmEq       = (totalCO2 * 3.99).toFixed(1);
  const litersEq   = (totalCO2 * 0.428).toFixed(2);

  const handleExportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Category,Total Scans,Total CO2 Avoided (kg)\n";
    stats.forEach((s) => { csv += `${s.category},${s.count},${s.totalCO2.toFixed(3)}\n`; });
    csv += `\nTOTAL,${totalScans},${totalCO2.toFixed(3)}`;
    csv += `\n\nEquivalency Metrics\nTree-Years of Absorption,${treesEq}\nKilometers Driven Avoided,${kmEq}`;
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `IWIS_BRSR_ESG_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const val = (v: string | number) =>
    loading ? (
      <span className="inline-block w-16 h-5 bg-[var(--surface-raised)] rounded animate-pulse" />
    ) : v;

  return (
    <ProtectedRoute>
      <div className="space-y-6 animate-fadeIn">

        {/* ── Page header ────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              ESG Reporting
            </p>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Carbon Accounting
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Scope 3 diversion metrics and material composition breakdown.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors shrink-0"
          >
            <DownloadIcon size={13} />
            BRSR / SEBI Export
          </button>
        </div>

        {/* ── KPI grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Net CO₂ Diversion",
              value: loading ? "—" : `${totalCO2.toFixed(2)} kg`,
              sub: "CO₂e avoided",
              Icon: CO2Icon,
              accent: true,
            },
            {
              label: "Total Scans",
              value: loading ? "—" : totalScans,
              sub: "waste items classified",
              Icon: BarChartIcon,
              accent: false,
            },
            {
              label: "Tree Equivalent",
              value: loading ? "—" : treesEq,
              sub: "tree-years of absorption",
              Icon: LeafIcon,
              accent: false,
            },
            {
              label: "Kilometers Avoided",
              value: loading ? "—" : kmEq,
              sub: "km of driving avoided",
              Icon: TrendUpIcon,
              accent: false,
            },
          ].map(({ label, value, sub, Icon, accent }) => (
            <div
              key={label}
              className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-[var(--text-secondary)]">{label}</p>
                <span className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  accent
                    ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]"
                    : "bg-[var(--surface-raised)] text-[var(--text-tertiary)]"
                }`}>
                  <Icon size={12} />
                </span>
              </div>
              <p className={`text-2xl font-semibold mb-0.5 ${
                accent ? "text-[var(--accent-text)]" : "text-[var(--text-primary)]"
              }`}>
                {loading ? (
                  <span className="inline-block w-20 h-6 bg-[var(--surface-raised)] rounded animate-pulse" />
                ) : value}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] group relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[var(--text-secondary)]">Fuel saved</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {val(`${litersEq} L`)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] hidden group-hover:block absolute top-full left-0 mt-2 p-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg shadow-lg z-10 w-72">
              **Fuel saved** — Calculated based on the energy required to process virgin materials vs recycled materials.
            </p>
          </div>
          <div className="flex flex-col px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] group relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[var(--text-secondary)]">Driving emissions avoided</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {val(`${kmEq} km`)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] hidden group-hover:block absolute top-full right-0 mt-2 p-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg shadow-lg z-10 w-72">
              **Driving emissions** — Equivalency based on an average passenger vehicle emitting 251g CO₂ per kilometer.
            </p>
          </div>
        </div>

        {/* ── Charts ─────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pie */}
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Composition</p>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Material Footprint</h2>
            </div>
            {stats.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                No scan data yet.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats}
                      dataKey="totalCO2"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={72}
                      strokeWidth={0}
                    >
                      {stats.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "var(--text-primary)",
                      }}
                      formatter={(v: any) => typeof v === "number" ? [`${v.toFixed(2)} kg`, "CO₂"] : v}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bar */}
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Breakdown</p>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Impact by Category</h2>
            </div>
            {stats.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                No scan data yet.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats} layout="vertical" margin={{ left: 4, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="category"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                      width={70}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "var(--surface-raised)" }}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "var(--text-primary)",
                      }}
                      formatter={(v: any) => typeof v === "number" ? [`${v.toFixed(2)} kg`, "CO₂"] : v}
                    />
                    <Bar dataKey="totalCO2" radius={[0, 3, 3, 0]} maxBarSize={20}>
                      {stats.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ── Compliance note ────────────────────────────────── */}
        <div className="pt-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
            CO₂ equivalencies based on EPA lifecycle assessment metrics. Reports are BRSR-aligned for SEBI compliance.
            <br />
            Methodology: Scope 3 Category 5 (Waste Generated in Operations). Tree absorption rate: 21 kg CO₂/year. Vehicle emission rate: 251 g CO₂/km.
          </p>
        </div>>
      </div>
    </ProtectedRoute>
  );
}
