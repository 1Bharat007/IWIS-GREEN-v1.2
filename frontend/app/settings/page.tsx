"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { CheckIcon, AlertIcon } from "@/components/ui/Icons";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState("System");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await apiFetch("/auth/me");
        setDisplayName(user.displayName || "");
        setEmail(user.email || "");

        // Local settings
        const savedTheme = localStorage.getItem("theme") || "System";
        const savedNotifs = localStorage.getItem("notifications") !== "false";
        setTheme(savedTheme);
        setNotificationsEnabled(savedNotifs);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleApplyTheme = (selectedTheme: string) => {
    if (selectedTheme === "Dark") {
      document.documentElement.classList.add("dark");
    } else if (selectedTheme === "Light") {
      document.documentElement.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  useEffect(() => {
    handleApplyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Save local preferences
      localStorage.setItem("notifications", notificationsEnabled ? "true" : "false");

      // Save profile to backend
      await apiFetch("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName }),
      });

      setToast({ message: "Settings saved successfully", type: "success" });
    } catch (err: any) {
      setToast({ message: err.backendMessage || err.message || "Failed to save settings", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center gap-2.5 py-12 justify-center text-sm text-[var(--text-tertiary)]">
          <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Loading settings…
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-6 py-2 animate-fadeIn">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-5">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            Preferences
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg border text-sm animate-fadeIn ${
            toast.type === "success"
              ? "border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent-text)]"
              : "border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-[var(--destructive)]"
          }`}>
            {toast.type === "success" ? <CheckIcon size={14} /> : <AlertIcon size={14} />}
            {toast.message}
          </div>
        )}

        {/* Profile Section */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full max-w-sm px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full max-w-sm px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--text-tertiary)] cursor-not-allowed"
              />
              <p className="mt-1 text-2xs text-[var(--text-tertiary)]">Email cannot be changed.</p>
            </div>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              Save Profile
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">App Preferences</h2>
          
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Email Notifications</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Receive weekly impact reports</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                notificationsEnabled ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"
              }`}
            >
              <span className={`block w-3.5 h-3.5 rounded-full bg-white absolute transition-transform ${
                notificationsEnabled ? "translate-x-5" : "translate-x-1"
              }`} />
            </button>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Interface Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full max-w-sm px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-colors cursor-pointer"
            >
              <option>System</option>
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-bg)]">
          <h2 className="text-sm font-semibold text-[var(--destructive)] mb-2">Danger Zone</h2>
          <p className="text-xs text-[var(--destructive)] opacity-90 mb-4 max-w-md">
            Permanently delete your account and all associated scan data. This action cannot be undone.
          </p>
          <button 
            onClick={() => {
              if (confirm("Are you absolutely sure? This cannot be undone.")) {
                alert("Account deletion flow coming soon.");
              }
            }}
            className="px-4 py-2 rounded-lg bg-[var(--destructive)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Delete Account
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
