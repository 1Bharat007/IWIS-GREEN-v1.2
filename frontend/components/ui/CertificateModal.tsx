"use client";

import { motion } from "framer-motion";

export default function CertificateModal({
  open,
  onClose,
  co2,
}: {
  open: boolean;
  onClose: () => void;
  co2: number;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#111827] p-10 rounded-3xl shadow-xl max-w-md text-center"
      >
        <h2 className="text-2xl font-semibold mb-4">
          Carbon Impact Certificate
        </h2>
        <p className="mb-6">
          You have avoided {co2.toFixed(1)} kg CO₂e.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-emerald-600 text-white rounded-full"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
