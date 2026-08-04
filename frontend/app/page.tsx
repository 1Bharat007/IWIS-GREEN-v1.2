"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";
import {
  ScanIcon, ShoppingIcon, BotIcon,
  ArrowRightIcon, LayoutIcon, HistoryIcon
} from "@/components/ui/Icons";
import { motion } from "framer-motion";

const FEATURES = [
  {
    Icon: ScanIcon,
    title: "AI Waste Scanner",
    desc: "Take a photo of your waste. Our AI instantly identifies the material and its estimated market value.",
  },
  {
    Icon: ShoppingIcon,
    title: "Sell from Home",
    desc: "Create a listing in one tap. Local Kabadiwalas will come to your door, weigh it, and pay you.",
  },
  {
    Icon: BotIcon,
    title: "EcoBot Assistant",
    desc: "Got questions about what can be recycled? Chat with our 24/7 AI assistant to get answers instantly.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Scan your waste",
    desc: "Use your camera to let our AI identify the material and show you the current market price.",
  },
  {
    step: "2",
    title: "Local Pickup",
    desc: "A verified local recycler accepts your listing and comes to your location to pick it up.",
  },
  {
    step: "3",
    title: "Get Paid",
    desc: "The recycler weighs the material, and you get paid instantly based on the actual weight.",
  },
];

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      apiFetch("/auth/me")
        .then((data) => {
          if (data) {
            const p = data.data || data;
            setProfile(p);
            if (p.city) setCity(p.city);
          }
        })
        .catch(() => {});
    }
  }, [isLoaded, isSignedIn]);

  const displayName = user?.firstName || profile?.displayName || "Member";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="space-y-12">

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="pt-6 pb-14 border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-xs font-semibold text-[var(--accent-text)] mb-6 shadow-sm">
            {city ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                Live in {city}
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                Available across India
              </>
            )}
          </div>

          {isLoaded && isSignedIn ? (
            /* Logged-In Tailored Home Dashboard */
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight tracking-tight mb-4">
                Welcome back, <span className="text-[var(--accent)]">{displayName}</span>! 👋
              </h1>
              <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto mb-8">
                Ready to turn recyclable waste into cash today? Scan items with AI, list waste for pickup, or track your green earnings.
              </p>

              {/* Direct Work Launcher Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
                <Link
                  href="/scan"
                  className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)] transition-all flex flex-col items-center text-center group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ScanIcon size={20} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Scan Waste</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] mt-0.5">AI Valuation</span>
                </Link>

                <Link
                  href="/sell"
                  className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)] transition-all flex flex-col items-center text-center group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ShoppingIcon size={20} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Sell Waste</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Doorstep Pickup</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)] transition-all flex flex-col items-center text-center group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <LayoutIcon size={20} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Dashboard</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Track Earnings</span>
                </Link>

                <Link
                  href="/chat"
                  className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)] transition-all flex flex-col items-center text-center group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <BotIcon size={20} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">EcoBot AI</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] mt-0.5">24/7 Assistant</span>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--text-primary)] text-[var(--bg)] rounded-xl text-[15px] font-semibold shadow-md hover:opacity-90 transition-all"
                >
                  Go to Main Dashboard
                  <ArrowRightIcon size={16} />
                </Link>
                <Link
                  href="/sell/history"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] rounded-xl text-[15px] font-medium shadow-sm hover:bg-[var(--surface-raised)] transition-all"
                >
                  My Waste Listings
                  <HistoryIcon size={16} />
                </Link>
              </div>
            </div>
          ) : (
            /* Guest / Unauthenticated Hero */
            <div>
              <h1 className="text-4xl sm:text-6xl font-bold text-[var(--text-primary)] leading-tight tracking-tight mb-6">
                Know the value. <br />
                <span className="text-[var(--accent)]">Sell the waste.</span> <br />
                Help India stay clean.
              </h1>

              <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto mb-10">
                Don't throw away recyclable materials. IWIS connects you directly with local recyclers so you can sell your waste from home.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  href="/scan"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--text-primary)] text-[var(--bg)] rounded-xl text-[15px] font-semibold shadow-md hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
                >
                  Scan & Sell Now
                  <ScanIcon size={16} />
                </Link>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] rounded-xl text-[15px] font-medium shadow-sm hover:bg-[var(--surface-raised)] transition-all duration-200"
                >
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works (Horizontal Carousel on Mobile, Grid on Desktop) ── */}
      <section className="py-6 border-b border-[var(--border)]">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">Three simple steps</h2>
          <p className="text-sm text-[var(--text-secondary)]">From trash to cash in minutes.</p>
        </div>

        {/* Mobile Horizontal Carousel indicator */}
        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-3 md:hidden px-1 font-medium">
          <span>Swipe cards →</span>
          <span>1 / 3</span>
        </div>

        {/* Carousel Container: flex overflow-x-auto on mobile, md:grid on laptop */}
        <div tabIndex={0} role="region" aria-label="Three simple steps carousel" className="flex md:grid md:grid-cols-3 gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded-2xl">
          {STEPS.map((s, idx) => (
            <div
              key={idx}
              className="min-w-[82vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0 md:shrink-1 relative flex flex-col items-center text-center p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)] transition-colors group shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center text-lg font-bold mb-5 shadow-sm group-hover:scale-110 transition-transform">
                {s.step}
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features (Horizontal Carousel on Mobile, Grid on Desktop) ── */}
      <section className="py-6">
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            Why IWIS?
          </p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            Everything you need. Nothing you don't.
          </h2>
        </div>

        {/* Mobile Horizontal Carousel indicator */}
        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-3 md:hidden px-1 font-medium">
          <span>Swipe features →</span>
          <span>1 / 3</span>
        </div>

        {/* Carousel Container: flex overflow-x-auto on mobile, md:grid on laptop */}
        <div tabIndex={0} role="region" aria-label="Why IWIS features carousel" className="flex md:grid md:grid-cols-3 gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded-2xl">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="min-w-[82vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0 md:shrink-1 p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-border)] transition-colors shadow-sm"
            >
              <Icon size={24} className="text-[var(--accent)] mb-4" />
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom Callout Section ── */}
      {isLoaded && isSignedIn ? (
        <section className="py-10 px-6 rounded-3xl bg-[var(--surface)] border border-[var(--accent-border)] text-center mb-12 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
            Ready to sell your recyclable waste?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
            Take an instant scan or post a waste listing for local Kabadiwalas to pick up directly from your doorstep.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              href="/scan"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-md"
            >
              Start AI Scan
              <ScanIcon size={16} />
            </Link>
            <Link
              href="/sell"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm font-semibold hover:bg-[var(--border)] transition-colors"
            >
              Create Waste Listing
              <ShoppingIcon size={16} />
            </Link>
          </div>
        </section>
      ) : isLoaded && !isSignedIn ? (
        <section className="py-16 mt-8 rounded-3xl bg-[var(--text-primary)] text-center text-[var(--bg)] mb-20">
          <h2 className="text-3xl font-bold mb-6">Ready to start earning?</h2>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--bg)] text-[var(--text-primary)] rounded-xl text-[15px] font-bold hover:scale-105 transition-transform shadow-lg"
          >
            Create a free account
            <ArrowRightIcon size={16} />
          </Link>
        </section>
      ) : null}
    </motion.div>
  );
}
