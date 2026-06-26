"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { 
  BarChartIcon, ShoppingIcon, LeafIcon, CheckCircleIcon, XIcon, ArrowRightIcon
} from "@/components/ui/Icons";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import Link from "next/link";

type Summary = {
  totalEarnings: number;
  totalWeightRecycled: number;
  totalTransactions: number;
  averageEarningsPerTransaction: number;
};

type Transaction = {
  id: string;
  material: string;
  finalWeightKg: number;
  pricePerKg: number;
  amount: number;
  platformFee: number;
  citizenEarnings: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  recyclerBusinessName: string;
  recyclerName: string;
};

export default function EarningsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [co2Saved, setCo2Saved] = useState(0);

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        const [sumRes, txRes, meRes] = await Promise.all([
          apiFetch("/transactions/summary"),
          apiFetch("/transactions"),
          apiFetch("/auth/me")
        ]);
        setSummary(sumRes);
        setTransactions(txRes);
        setCo2Saved(meRes.totalCO2 || 0);
      } catch (err) {
        console.error("Failed to fetch earnings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarningsData();
  }, []);

  // Format chart data by aggregating earnings per day
  const chartData = [...transactions].reverse().reduce((acc: any[], tx) => {
    const date = new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.earnings += tx.citizenEarnings;
    } else {
      acc.push({ date, earnings: tx.citizenEarnings });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  const hasEarnings = summary && summary.totalTransactions > 0;

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 animate-fadeIn space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Financial Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track your recycling earnings and environmental impact.
          </p>
        </div>

        {/* Payment Transparency Banner */}
        <div className="p-4 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-subtle)] flex items-start gap-4">
          <div className="shrink-0 mt-0.5 text-[var(--accent)]">
            <span className="text-xl">💡</span>
          </div>
          <div className="text-sm text-[var(--accent-text)] space-y-2">
            <p className="font-semibold">This page tracks your recycling earnings.</p>
            <p>Payments are made directly between you and the recycler during pickup.</p>
            <div>
              <span className="font-medium">Supported payment methods:</span>
              <ul className="list-disc list-inside mt-1 ml-1">
                <li>Cash</li>
                <li>UPI</li>
              </ul>
            </div>
            <p className="text-xs opacity-80 pt-1">IWIS records transactions but does not currently process payments.</p>
          </div>
        </div>

        {!hasEarnings ? (
          <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] mb-4">
              <ShoppingIcon size={24} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No recycling earnings yet</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
              Create your first waste listing and start earning money while helping the environment.
            </p>
            <Link href="/sell" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity">
              Create Listing
            </Link>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Total Earnings</p>
                <p className="text-2xl font-bold text-[var(--accent-text)]">₹{summary.totalEarnings.toFixed(2)}</p>
              </div>
              <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Total Recycled</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{summary.totalWeightRecycled.toFixed(1)} <span className="text-sm font-medium text-[var(--text-secondary)]">kg</span></p>
              </div>
              <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Transactions</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{summary.totalTransactions}</p>
              </div>
              <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">CO₂ Avoided</p>
                <div className="flex items-end gap-1">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{co2Saved.toFixed(1)}</p>
                  <span className="text-sm font-medium text-[var(--text-secondary)] mb-1">kg</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-6">Earnings Over Time</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickFormatter={(value: number | string | undefined) => `₹${Number(value ?? 0)}`} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', fontSize: '12px', color: 'var(--text-primary)' }}
                      itemStyle={{ color: 'var(--accent-text)', fontWeight: 600 }}
                      formatter={(value: number | string | undefined) => [`₹${Number(value ?? 0).toFixed(2)}`, 'Earnings']}
                    />
                    <Line type="monotone" dataKey="earnings" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Transaction History</h3>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="grid grid-cols-5 md:grid-cols-6 gap-4 p-4 border-b border-[var(--border)] bg-[var(--surface-raised)] text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  <div className="col-span-2">Date & Material</div>
                  <div className="hidden md:block">Recycler</div>
                  <div>Weight</div>
                  <div className="text-right">Earnings</div>
                  <div className="text-right">Status</div>
                </div>
                
                <div className="divide-y divide-[var(--border)]">
                  {transactions.map(tx => (
                    <div 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="grid grid-cols-5 md:grid-cols-6 gap-4 p-4 items-center hover:bg-[var(--surface-raised)] cursor-pointer transition-colors"
                    >
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{tx.material}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-sm text-[var(--text-secondary)] truncate">{tx.recyclerBusinessName || tx.recyclerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">{tx.finalWeightKg} kg</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[var(--accent-text)]">₹{tx.citizenEarnings.toFixed(2)}</p>
                      </div>
                      <div className="text-right flex justify-end">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--accent-subtle)] text-xs font-medium text-[var(--accent-text)]">
                          <CheckCircleIcon size={11} />
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                <XIcon size={16} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Material</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{selectedTx.material}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Final Weight</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{selectedTx.finalWeightKg} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Price</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">₹{selectedTx.pricePerKg}/kg</span>
              </div>
              <div className="border-t border-[var(--border)] pt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-secondary)]">Gross Amount</span>
                  <span className="text-sm text-[var(--text-primary)]">₹{selectedTx.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-secondary)]">Platform Fee (2%)</span>
                  <span className="text-sm text-[var(--destructive)]">-₹{selectedTx.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Net Earnings</span>
                  <span className="text-lg font-bold text-[var(--accent-text)]">₹{selectedTx.citizenEarnings.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-[var(--border)] pt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-tertiary)]">Pickup Date</span>
                  <span className="text-xs text-[var(--text-secondary)]">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-tertiary)]">Recycler</span>
                  <span className="text-xs text-[var(--text-secondary)]">{selectedTx.recyclerBusinessName || selectedTx.recyclerName}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[var(--surface-raised)] border-t border-[var(--border)]">
              <button onClick={() => setSelectedTx(null)} className="w-full py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-medium hover:bg-[var(--surface-raised)] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
