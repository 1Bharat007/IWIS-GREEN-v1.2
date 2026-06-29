"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import {
  ScanIcon, ShoppingIcon, BotIcon,
  ArrowRightIcon, CheckIcon, LayoutIcon, HistoryIcon
} from "@/components/ui/Icons";

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
  const [authed, setAuthed] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    setAuthed(!!token);
    
    if (token) {
      apiFetch("/auth/me")
        .then(data => {
          if (data && data.city) {
            setCity(data.city);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="animate-fadeIn">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-16 pb-20 border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-xs font-semibold text-[var(--accent-text)] mb-6">
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

          <h1 className="text-4xl sm:text-6xl font-bold text-[var(--text-primary)] leading-tight tracking-tight mb-6">
            Know the value. <br />
            <span className="text-[var(--accent)]">Sell the waste.</span> <br />
            Help India stay clean.
          </h1>

          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto mb-10">
            Don't throw away recyclable materials. IWIS connects you directly with local recyclers so you can sell your waste from home.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {!loading && authed ? (
              <>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--text-primary)] text-[var(--bg)] rounded-xl text-[15px] font-semibold shadow-md hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
                >
                  Go to Dashboard
                  <LayoutIcon size={16} />
                </Link>
                <Link
                  href="/scan"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] rounded-xl text-[15px] font-medium shadow-sm hover:bg-[var(--surface-raised)] transition-all duration-200"
                >
                  Scan Waste
                  <ScanIcon size={16} />
                </Link>
                <Link
                  href="/sell/history"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] rounded-xl text-[15px] font-medium shadow-sm hover:bg-[var(--surface-raised)] transition-all duration-200"
                >
                  My Listings
                  <HistoryIcon size={16} />
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="py-20 border-b border-[var(--border)]">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Three simple steps</h2>
          <p className="text-[var(--text-secondary)]">From trash to cash in minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {STEPS.map((s, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)] transition-colors group">
              <div className="w-12 h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center text-lg font-bold mb-6 shadow-sm group-hover:scale-110 transition-transform">
                {s.step}
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">{s.title}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section className="py-20">
        <div className="mb-12">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Why IWIS?
          </p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            Everything you need. Nothing you don't.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--border-strong)] transition-colors">
              <Icon size={24} className="text-[var(--text-primary)] mb-4" />
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      {!loading && !authed && (
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
      )}
    </div>
  );
}
