"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@/components/ui/Icons";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Last updated: July 30, 2026
        </p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">1. Information We Collect</h2>
          <p>
            IWIS collects information you provide directly, such as your profile details (displayName, phone, email, location city/state/pincode, and UPI VPA), waste scan images uploaded for material classification, and pickup transaction records.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">2. How We Use Information</h2>
          <p>
            Your information is used strictly to provide intelligent waste classification, link citizens with verified local scrap recyclers for pickup execution, calculate carbon credits and CO₂ offset statistics, and process payout rewards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">3. Data Security & Storage</h2>
          <p>
            All network communication is encrypted over HTTPS. Passwords and credentials are managed using Clerk enterprise security. Operational database data is safely stored using PostgreSQL with TLS encryption.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">4. Your Data Rights</h2>
          <p>
            You may request a copy of your stored data or request permanent account deletion at any time via Account Settings or by contacting support at support@iwis.org.
          </p>
        </section>
      </div>
    </motion.div>
  );
}
