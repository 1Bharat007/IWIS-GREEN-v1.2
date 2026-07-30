"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="max-w-3xl mx-auto py-8 space-y-8"
    >
      <div>
        <Link href="/settings" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 mb-3">
          ← Back to Settings
        </Link>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Terms of Service</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Last updated: July 30, 2026
        </p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">1. Platform Scope</h2>
          <p>
            IWIS (Intelligent Waste Information System) connects households and businesses ("Citizens") with verified waste collectors ("Recyclers") to facilitate sustainable waste segregation, computer vision classification, and circular economic recycling across India.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">2. User Responsibilities</h2>
          <p>
            Users agree to provide accurate waste descriptions and estimates during scan creation, ensure safe and accessible pickup locations, and conduct all transactions respectfully. Recyclers agree to honor agreed pickup schedules and accurate weight measurements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">3. Payments & Scrap Rates</h2>
          <p>
            Scrap pricing recommendations are derived from local daily market rates. Payouts are made directly between recyclers and citizens via UPI or cash upon physical verification and weight measurement during pickup.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">4. Revisions & Support</h2>
          <p>
            IWIS reserves the right to modify service features and terms. For assistance, feedback, or support, please contact us at support@iwis.org.
          </p>
        </section>
      </div>
    </motion.div>
  );
}
