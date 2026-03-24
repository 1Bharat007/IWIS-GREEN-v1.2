"use client";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState("System");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    // Load existing settings
    const savedName = localStorage.getItem("iwis_name") || "";
    const savedEmail = localStorage.getItem("iwis_email") || "";
    const savedTheme = localStorage.getItem("theme") || "System";
    const savedNotifs = localStorage.getItem("notifications") !== "false";

    setDisplayName(savedName);
    setEmail(savedEmail);
    setTheme(savedTheme);
    setNotificationsEnabled(savedNotifs);
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

  const saveChanges = () => {
    localStorage.setItem("iwis_name", displayName);
    localStorage.setItem("iwis_email", email);
    localStorage.setItem("notifications", notificationsEnabled ? "true" : "false");
    
    setToast({ message: "Settings saved successfully!", type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };
  
  return (
    <ProtectedRoute>
      <div className="space-y-10 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-semibold tracking-tight">
            Settings
          </h1>
        </div>

        {toast && (
          <div className={`p-4 rounded-xl text-sm font-medium transition ${toast.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
            {toast.message}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="p-8 bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-medium mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name" 
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" 
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition" 
                />
              </div>
              <button 
                onClick={saveChanges}
                className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="p-8 bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-medium mb-4">Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-neutral-500">Receive weekly impact reports</p>
                </div>
                <button 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="font-medium">App Theme</h3>
                  <p className="text-sm text-neutral-500">Select your preferred interface theme</p>
                </div>
                <select 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg p-2 text-sm outline-none cursor-pointer"
                >
                  <option>System</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="p-8 bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-red-200 dark:border-red-900">
            <h2 className="text-xl font-medium text-red-600 mb-4">Danger Zone</h2>
            <p className="text-sm text-neutral-500 mb-4">Permanently delete your account and all associated scan data. This action cannot be undone.</p>
            <button className="bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
