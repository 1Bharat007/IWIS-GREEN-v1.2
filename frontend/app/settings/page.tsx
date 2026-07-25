"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import {
  SettingsIcon,
  CheckCircleIcon,
  DownloadIcon,
  TrashIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  MoonIcon,
  SunIcon,
  UserIcon
} from "@/components/ui/Icons";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiSuccess, setUpiSuccess] = useState("");
  const [upiError, setUpiError] = useState("");

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
    apiFetch("/auth/me")
      .then((res) => {
        if (res?.upiId) setUpiId(res.upiId);
      })
      .catch(() => {});
  }, []);

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpiError("");
    setUpiSuccess("");
    const trimmed = upiId.trim();
    if (trimmed && !/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(trimmed)) {
      setUpiError("Invalid UPI ID format (e.g., name@upi or phone@ybl).");
      return;
    }
    try {
      setSavingUpi(true);
      await apiFetch("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ upiId: trimmed }),
      });
      setUpiSuccess("UPI ID updated successfully.");
    } catch (err: any) {
      setUpiError(err.backendMessage || err.message || "Failed to update UPI ID.");
    } finally {
      setSavingUpi(false);
    }
  };

  const handleDownloadData = () => {
    alert("Data download request submitted. You will receive an email shortly.");
  };

  const handleDeleteAccount = () => {
    const confirm = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirm) {
      alert("Account deletion initiated. Contact support if this was a mistake.");
    }
  };

  return (
    <ProtectedRoute>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Account Settings</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage your preferences and privacy settings.</p>
        </div>

        <div className="space-y-6">
          
          {/* ── APPEARANCE ── */}
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <SunIcon size={18} className="text-[var(--text-secondary)]" />
                Appearance
              </h2>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">Theme Preference</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Choose how IWIS looks to you.</p>
                </div>
                {mounted && (
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                  >
                    <option value="system">System Default</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                )}
              </div>
            </div>
          </section>

          {/* ── NOTIFICATIONS ── */}
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <SettingsIcon size={18} className="text-[var(--text-secondary)]" />
                Preferences
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">Email Notifications</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Receive updates about pickups and earnings.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                </label>
              </div>
            </div>
          </section>

          {/* ── PAYMENTS & PAYOUT ── */}
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <UserIcon size={18} className="text-[var(--text-secondary)]" />
                Payout & UPI Settings
              </h2>
            </div>
            <div className="p-5">
              <form onSubmit={handleSaveUpi} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    UPI ID (VPA)
                  </label>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                    Save your Virtual Payment Address (e.g. username@upi or mobile@ybl) to receive direct P2P payments from recyclers.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="e.g. alex@okicici or 9876543210@ybl"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={savingUpi}
                      className="px-5 py-2.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {savingUpi ? "Saving..." : "Save UPI ID"}
                    </button>
                  </div>
                </div>

                {upiSuccess && (
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-2">{upiSuccess}</p>
                )}
                {upiError && (
                  <p className="text-xs font-medium text-[var(--destructive)] mt-2">{upiError}</p>
                )}
              </form>
            </div>
          </section>
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircleIcon size={18} className="text-[var(--text-secondary)]" />
                Data & Privacy
              </h2>
            </div>
            
            <div className="p-5 space-y-6">
              
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                <div className="pr-4">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">Download your data</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Get a copy of your IWIS data, including past pickups, earnings, and uploaded waste scans.
                  </p>
                </div>
                <button onClick={handleDownloadData} className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[var(--surface-raised)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg text-sm font-medium transition-colors">
                  <DownloadIcon size={14} />
                  Download
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
                <div className="pr-4">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">Privacy Policies</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Read how we protect your data and comply with digital privacy regulations.
                  </p>
                </div>
                <div className="shrink-0 flex flex-col gap-2">
                  <Link href="/privacy" className="text-xs text-[var(--accent-text)] hover:underline flex items-center gap-1">
                    Privacy Policy <ExternalLinkIcon size={10} />
                  </Link>
                  <Link href="/terms" className="text-xs text-[var(--accent-text)] hover:underline flex items-center gap-1">
                    Terms of Service <ExternalLinkIcon size={10} />
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="pr-4">
                  <h3 className="text-sm font-medium text-[var(--destructive)] mb-1">Delete Account</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <button onClick={handleDeleteAccount} className="shrink-0 flex items-center gap-2 px-4 py-2 border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-[var(--destructive)] hover:opacity-80 rounded-lg text-sm font-medium transition-colors">
                  <TrashIcon size={14} />
                  Delete
                </button>
              </div>

            </div>
          </section>

        </div>
      </motion.div>
    </ProtectedRoute>
  );
}
