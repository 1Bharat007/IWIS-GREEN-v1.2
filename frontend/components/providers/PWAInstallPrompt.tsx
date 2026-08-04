"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, XIcon } from "@/components/ui/Icons";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user already dismissed the prompt
    if (localStorage.getItem("iwis_pwa_dismissed") === "true") return;

    // Check if already installed as standalone PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // Check for iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iosDevice);

    // Listen for Android / Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show iOS tip if on iOS Safari and not standalone
    if (iosDevice && !isStandalone) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.setItem("iwis_pwa_dismissed", "true");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("iwis_pwa_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 p-4 rounded-2xl bg-[var(--surface-raised)] border border-[var(--accent-border)] shadow-xl flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
        <DownloadIcon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Install IWIS App</h4>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
          {isIOS
            ? "Tap the Share button in Safari and select 'Add to Home Screen' for instant offline access."
            : "Install IWIS on your home screen for quick offline access and high-speed waste scanning."}
        </p>
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="mt-2.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            Install App
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shrink-0"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
}
