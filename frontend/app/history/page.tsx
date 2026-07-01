"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { ArrowRightIcon, RefreshIcon, CheckIcon } from "@/components/ui/Icons";

type HistoryScan = {
  id: string;
  category: string;
  subCategory?: string;
  confidence: number;
  co2: number;
  timestamp: string;
  thumbnail: string | null;
  estimatedPricePerKg: number | null;
  estimatedWeight?: number | null;
  marketDemand?: string;
  aiVersion?: string;
  recyclability?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  Plastic: "Plastic",
  Paper:   "Paper",
  Metal:   "Metal",
  Glass:   "Glass",
  Organic: "Organic",
  Other:   "Mixed / Other",
};

export default function SmartHistoryPage() {
  const [scans, setScans] = useState<HistoryScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filters & Search
  const [search, setSearch] = useState("");
  const [material, setMaterial] = useState("");
  const [sort, setSort] = useState("newest");

  // Fetch logic wrapped in useCallback to avoid rerenders
  const fetchHistory = useCallback(async (currentPage: number, currentSearch: string, currentMaterial: string, currentSort: string) => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * limit;
      let url = `/waste/history?limit=${limit}&offset=${offset}`;
      if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
      if (currentMaterial) url += `&material=${encodeURIComponent(currentMaterial)}`;
      if (currentSort) url += `&sort=${currentSort}`;

      const __response = await apiFetch(url);
        const _response = __response.data || __response;
        const response = _response.data || _response;
      const data = response.data || {};
      setScans(data.history || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error("Failed to load smart history", err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchHistory(page, search, material, sort);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, material, sort, fetchHistory]);

  const totalPages = Math.ceil(totalCount / limit);

  // Memoize scan cards to prevent rerenders on filter typing
  const scanCards = useMemo(() => {
    if (scans.length === 0 && !loading) {
      return (
        <div className="text-center py-16 px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="w-16 h-16 bg-[var(--surface-raised)] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No scans found</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
            Try adjusting your search or filters, or scan a new item.
          </p>
        </div>
      );
    }

    return scans.map((scan) => (
      <div 
        key={scan.id} 
        className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-border)] transition-colors shadow-sm"
      >
        <div className="shrink-0 w-20 h-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg overflow-hidden flex items-center justify-center">
          {scan.thumbnail ? (
            <img src={scan.thumbnail} alt={scan.category} className="w-full h-full object-cover" />
          ) : (
            <CheckIcon size={20} className="text-[var(--text-tertiary)] opacity-30" />
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {CATEGORY_LABELS[scan.category] ?? scan.category}
                {scan.subCategory && <span className="ml-2 text-xs font-normal text-[var(--text-tertiary)]">({scan.subCategory})</span>}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {new Date(scan.timestamp).toLocaleString(undefined, {
                  month: "short", day: "numeric", hour: "numeric", minute: "numeric"
                })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-[var(--accent-text)]">
                {scan.estimatedPricePerKg != null ? `₹${scan.estimatedPricePerKg}/kg` : "---"}
              </span>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {scan.confidence}% Confidence
              </p>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-3">
            <Link 
              href={`/sell?material=${scan.category}`}
              className="px-3 py-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Create Listing
            </Link>
            <Link 
              href="/scan"
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors"
            >
              Repeat Scan
            </Link>
            <button className="px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors ml-auto">
              Share
            </button>
            <button className="px-3 py-1.5 text-xs text-[var(--destructive)] hover:bg-[var(--destructive-bg)] rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    ));
  }, [scans, loading]);

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Smart History</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Your searchable recycling knowledge base.</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-[var(--surface-raised)] p-4 rounded-xl border border-[var(--border)]">
          <input 
            type="text" 
            placeholder="Search material or sub-category..." 
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select 
            className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            value={material}
            onChange={(e) => { setMaterial(e.target.value); setPage(1); }}
          >
            <option value="">All Materials</option>
            {Object.keys(CATEGORY_LABELS).map(k => (
              <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
            ))}
          </select>
          <select 
            className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_value">Highest Value</option>
            <option value="highest_co2">Highest CO₂</option>
            <option value="highest_confidence">Highest Confidence</option>
          </select>
        </div>

        <div className="space-y-4 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg)]/50 backdrop-blur-sm rounded-xl">
              <span className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {scanCards}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-raised)]"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--text-secondary)]">
              Page {page} of {totalPages}
            </span>
            <button 
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-raised)]"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
