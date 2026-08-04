"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DownloadIcon, CheckIcon, ScanIcon, ShoppingIcon, ArrowRightIcon } from "@/components/ui/Icons";

export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios" | "windows" | "mac" | "linux">("android");

  useEffect(() => {
    // Check if running as standalone app
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    setIsInstalled(!!standalone);

    // Detect user OS
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setActiveTab("ios");
    else if (/android/.test(ua)) setActiveTab("android");
    else if (/win/.test(ua)) setActiveTab("windows");
    else if (/mac/.test(ua)) setActiveTab("mac");
    else if (/linux/.test(ua)) setActiveTab("linux");

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-12"
    >
      {/* ── HERO BANNER ── */}
      <section className="text-center bg-gradient-to-b from-[var(--surface-raised)] to-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 sm:p-12 shadow-sm">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[var(--accent)] to-emerald-400 p-0.5 shadow-lg mx-auto mb-6">
          <div className="w-full h-full bg-[var(--surface)] rounded-[22px] flex items-center justify-center">
            <span className="text-2xl font-black text-[var(--accent)] tracking-tight">IW</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4">
          Get the <span className="text-[var(--accent)]">IWIS App</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-8 leading-relaxed">
          Install IWIS on your smartphone, tablet, or desktop for high-speed AI waste scanning, instant doorstep pickups, and offline access.
        </p>

        {isInstalled ? (
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold text-sm">
            <CheckIcon size={18} />
            IWIS App Installed & Ready
          </div>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-[var(--accent)] text-white rounded-2xl text-base font-bold shadow-lg hover:bg-[var(--accent-hover)] hover:scale-105 transition-all"
          >
            <DownloadIcon size={20} />
            Install IWIS App Now
          </button>
        ) : (
          <p className="text-xs text-[var(--text-tertiary)] font-medium">
            Follow the platform instructions below to add IWIS to your home screen or desktop.
          </p>
        )}
      </section>

      {/* ── PLATFORM SELECTOR TABS ── */}
      <section>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 text-center">
          Choose Your Platform
        </h2>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: "android", label: "Android", icon: "🤖" },
            { id: "ios", label: "iOS (iPhone/iPad)", icon: "🍎" },
            { id: "windows", label: "Windows PC", icon: "🪟" },
            { id: "mac", label: "macOS", icon: "💻" },
            { id: "linux", label: "Linux", icon: "🐧" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-[var(--text-primary)] text-[var(--bg)] shadow-md"
                  : "bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── INSTRUCTION CARD ── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm">
          {activeTab === "android" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Android Installation</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Google Chrome, Brave, or Samsung Internet</p>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-[var(--text-secondary)] pl-5 list-decimal leading-relaxed">
                <li>Open <strong>IWIS</strong> in Chrome or your default Android browser.</li>
                <li>Tap the <strong>Install App</strong> button banner at the bottom or open Chrome's menu (<code>⋮</code>).</li>
                <li>Select <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
                <li>The IWIS app icon will be placed directly in your app drawer and home screen.</li>
              </ol>
            </div>
          )}

          {activeTab === "ios" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🍎</span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">iOS (iPhone & iPad) Installation</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Apple Safari Browser</p>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-[var(--text-secondary)] pl-5 list-decimal leading-relaxed">
                <li>Open <strong>IWIS</strong> in <strong>Safari</strong> on your iPhone or iPad.</li>
                <li>Tap the <strong>Share</strong> button (<span className="font-semibold text-[var(--accent)]">↑</span>) at the bottom toolbar.</li>
                <li>Scroll down the share sheet and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner. The IWIS squircle app icon will appear on your iPhone home screen.</li>
              </ol>
            </div>
          )}

          {activeTab === "windows" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🪟</span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Windows Installation</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Microsoft Edge or Google Chrome</p>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-[var(--text-secondary)] pl-5 list-decimal leading-relaxed">
                <li>Open <strong>IWIS</strong> in Microsoft Edge or Google Chrome on Windows.</li>
                <li>Look for the <strong>Install icon</strong> (small computer screen with down arrow) in the address bar.</li>
                <li>Click <strong>Install</strong> to add IWIS to your Windows Start Menu and Taskbar.</li>
              </ol>
            </div>
          )}

          {activeTab === "mac" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">💻</span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">macOS Installation</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Google Chrome or Safari (macOS Sonoma+)</p>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-[var(--text-secondary)] pl-5 list-decimal leading-relaxed">
                <li>In Chrome: Click the install icon in the URL bar, or open menu $\rightarrow$ <strong>Save and Share</strong> $\rightarrow$ <strong>Install IWIS</strong>.</li>
                <li>In Safari (macOS Sonoma+): Click <strong>File</strong> $\rightarrow$ <strong>Add to Dock</strong>.</li>
                <li>IWIS will launch in its own standalone Mac window with native notifications.</li>
              </ol>
            </div>
          )}

          {activeTab === "linux" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐧</span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Linux Installation</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Chromium, Chrome, or Firefox</p>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-[var(--text-secondary)] pl-5 list-decimal leading-relaxed">
                <li>Open <strong>IWIS</strong> in Chromium or Chrome on Linux.</li>
                <li>Click the URL bar install icon or <strong>Save and Share</strong> $\rightarrow$ <strong>Create Shortcut (Open as window)</strong>.</li>
                <li>Launch IWIS directly from your application launcher or desktop menu.</li>
              </ol>
            </div>
          )}
        </div>
      </section>

      {/* ── QUICK WORKFLOW ACTION CARDS ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center mb-4">
              <ShoppingIcon size={24} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Sell Waste</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              Have scrap, plastics, electronics, or metal at home? Post a listing for local recyclers to pick up from your door.
            </p>
          </div>
          <Link
            href="/sell"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[var(--text-primary)] text-[var(--bg)] rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            Create Waste Listing
            <ArrowRightIcon size={16} />
          </Link>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <ScanIcon size={24} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Buy Waste / Marketplace</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              Are you a Kabadiwala or recycler? Browse available waste listings nearby, place competitive bids, or pick up materials.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all"
          >
            Browse Marketplace
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </section>
    </motion.div>
  );
}
