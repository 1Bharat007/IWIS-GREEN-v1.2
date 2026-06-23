import Link from "next/link";
import {
  ScanIcon, LeafIcon, ShoppingIcon, MapPinIcon, TrophyIcon, BotIcon,
  ArrowRightIcon, BarChartIcon, CheckIcon,
} from "@/components/ui/Icons";

const FEATURES = [
  {
    Icon: ScanIcon,
    title: "Computer Vision AI",
    desc: "Multi-class waste classification — plastic, organic, metal, glass — with confidence scoring via Gemini Vision.",
  },
  {
    Icon: LeafIcon,
    title: "Scope 3 Accounting",
    desc: "Calculate avoided CO₂ per batch. Aligned with India's NDC commitments and BRSR reporting standards.",
  },
  {
    Icon: ShoppingIcon,
    title: "Circular Marketplace",
    desc: "Connects citizens to Material Recovery Facilities via a transparent bid-based reverse supply chain.",
  },
  {
    Icon: MapPinIcon,
    title: "Geospatial Heatmaps",
    desc: "City-level tracking of illegal dumping hotspots to optimize municipal dispatch routes and interventions.",
  },
  {
    Icon: TrophyIcon,
    title: "Gamified Incentives",
    desc: "Green Points, weekly streaks, and tier progression drive measurable long-term behavioral change.",
  },
  {
    Icon: BotIcon,
    title: "EcoBot Assistant",
    desc: "24/7 LLM assistant trained on India's waste management policies, segregation rules, and IWIS platform.",
  },
];

const STATS = [
  { value: "62M", label: "Tonnes of waste generated annually in India" },
  { value: "2070", label: "India's Net Zero target year" },
  { value: "1500+", label: "Scans classified by the AI engine" },
];

export default function Home() {
  return (
    <div className="animate-fadeIn">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-16 pb-20 border-b border-[var(--border)]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] text-xs font-medium text-[var(--text-secondary)] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            India Net Zero 2070 · BRSR Aligned · Scope 3 Reporting
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold text-[var(--text-primary)] leading-tight tracking-tight mb-5">
            Intelligent Waste<br />Information System
          </h1>

          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mb-8">
            AI-powered waste management for governments, municipalities, ESG teams, and recyclers.
            From household scanning to city-level carbon accounting — in one platform.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Open AI Scanner
              <ArrowRightIcon size={13} />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg text-sm font-medium hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats row ────────────────────────────────────────── */}
      <section className="py-10 border-b border-[var(--border)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
          {STATS.map(({ value, label }) => (
            <div key={value} className="px-0 sm:px-8 py-4 sm:py-0 first:pl-0 last:pr-0">
              <p className="text-2xl font-semibold text-[var(--text-primary)] mb-0.5">{value}</p>
              <p className="text-sm text-[var(--text-secondary)]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Core Technology ──────────────────────────────────── */}
      <section className="py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Platform
          </p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            Core technology
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-lg">
            Built for real-world deployment at scale — from individual households to city-level administration.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="bg-[var(--surface)] p-6 hover:bg-[var(--surface-raised)] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-center text-[var(--text-secondary)] mb-4">
                <Icon size={14} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────── */}
      <section className="py-8 px-6 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Ready to track your environmental impact?
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Create an account to start scanning, earning Green Points, and generating BRSR-compliant ESG reports.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get started
            <ArrowRightIcon size={13} />
          </Link>
          <Link
            href="/login"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Compliance row ───────────────────────────────────── */}
      <section className="pb-16">
        <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--text-tertiary)]">
          {[
            "BRSR Reporting",
            "India NDC Aligned",
            "Scope 3 Compliant",
            "WCAG 2.1 AA",
            "Open Source",
          ].map((badge) => (
            <span key={badge} className="flex items-center gap-1.5">
              <CheckIcon size={11} className="text-[var(--accent)]" />
              {badge}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
