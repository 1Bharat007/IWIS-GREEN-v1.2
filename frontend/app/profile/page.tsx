"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import {
  UserIcon,
  BarChartIcon,
  CheckCircleIcon,
  SettingsIcon,
  LogOutIcon,
  InfoIcon,
  LeafIcon
} from "@/components/ui/Icons";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { clearToken } from "@/lib/session";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/auth/me")
      .then((data) => {
        setProfile(data);
      })
      .catch(() => {
        // Handle error quietly
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    try {
      if (auth) {
        signOut(auth).catch(() => {});
      }
    } catch { /* ignore */ }
    clearToken();
    localStorage.removeItem("iwis-user");
    localStorage.removeItem("iwis-impact");
    router.push("/login");
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-64">
          <span className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="text-center py-20 text-[var(--text-secondary)]">Failed to load profile.</div>
      </ProtectedRoute>
    );
  }

  const isRecycler = profile.role === "recycler";
  const memberSince = new Date(profile.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn pb-20">
        
        {/* ── IDENTITY SECTION ── */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[var(--accent)] to-blue-500 opacity-20" />
          
          <div className="relative flex flex-col sm:flex-row items-center gap-6 mt-8">
            <div className="w-24 h-24 rounded-full bg-[var(--surface-raised)] border-4 border-[var(--surface)] shadow-md flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-[var(--text-tertiary)] uppercase">
                {profile.displayName?.charAt(0) || "U"}
              </span>
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center justify-center sm:justify-start gap-2">
                {profile.displayName || "IWIS User"}
                {(profile.isApproved || !isRecycler) && (
                  <CheckCircleIcon size={20} className="text-[var(--accent)]" />
                )}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mb-3">
                {profile.email} • {profile.phone || "+91 XXXXXXXXXX"}
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--surface-raised)] text-[var(--text-secondary)]">
                  Member since {memberSince}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                  {isRecycler ? "Collector" : "Seller"} Account
                </span>
                {isRecycler && profile.recyclerRating && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    ★ {profile.recyclerRating.toFixed(1)} Rating
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── IMPACT SECTION ── */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 px-2">Your Impact</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm flex flex-col">
              <span className="text-[var(--text-tertiary)] mb-2"><CheckCircleIcon size={20} /></span>
              <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                {isRecycler ? profile.completedPickups : profile.successfulListings}
              </p>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                {isRecycler ? "Completed Pickups" : "Successful Listings"}
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm flex flex-col">
              <span className="text-[var(--accent)] mb-2"><BarChartIcon size={20} /></span>
              <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                ₹{profile.totalEarnings?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Total Earnings</p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm flex flex-col">
              <span className="text-blue-500 mb-2"><LeafIcon size={20} /></span>
              <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                {profile.totalWasteRecycledKg?.toFixed(1) || "0"} <span className="text-base text-[var(--text-secondary)] font-normal">kg</span>
              </p>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Waste Recycled</p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm flex flex-col">
              <span className="text-emerald-500 mb-2">☁️</span>
              <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                {profile.totalCO2?.toFixed(1) || "0"} <span className="text-base text-[var(--text-secondary)] font-normal">kg</span>
              </p>
              <p className="text-xs text-[var(--text-secondary)] font-medium">CO₂ Saved</p>
            </div>

          </div>
        </section>

        {/* ── QUICK ACTIONS ── */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 px-2">Quick Actions</h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
            
            <Link href="/settings" className="flex items-center gap-4 p-4 hover:bg-[var(--surface-raised)] transition-colors border-b border-[var(--border)] group">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] group-hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
                <SettingsIcon size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Account Settings</h3>
                <p className="text-xs text-[var(--text-secondary)]">Theme, Password, Privacy</p>
              </div>
            </Link>

            <button className="w-full flex items-center gap-4 p-4 hover:bg-[var(--surface-raised)] transition-colors border-b border-[var(--border)] group text-left">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] group-hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
                <InfoIcon size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Help & Support</h3>
                <p className="text-xs text-[var(--text-secondary)]">Contact operations team</p>
              </div>
            </button>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 hover:bg-[var(--destructive-bg)] transition-colors group text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] group-hover:bg-[var(--destructive-border)] flex items-center justify-center text-[var(--destructive)] transition-colors">
                <LogOutIcon size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-[var(--destructive)]">Log Out</h3>
              </div>
            </button>

          </div>
        </section>

      </div>
    </ProtectedRoute>
  );
}
