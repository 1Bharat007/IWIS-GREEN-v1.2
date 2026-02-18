"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ScanPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    const reader = new FileReader();

    reader.onloadend = async () => {
      setLoading(true);
      setResult(null);

      const base64 = reader.result as string;

      // Simulated AI processing delay
      await new Promise((res) => setTimeout(res, 2000));

      try {
        const data = await apiFetch("/waste/scan", {
          method: "POST",
          body: JSON.stringify({ image: base64 }),
        });

        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-3xl font-semibold">Smart Waste Scanner</h1>

      <p className="text-sm text-[var(--muted)]">
        Upload an image of waste material. Our AI analyzes category,
        environmental impact, and gives smart recycling tips.
      </p>

      <label className="cursor-pointer px-6 py-3 border border-[var(--border)] rounded-lg 
        bg-[var(--card)] hover:bg-neutral-200 dark:hover:bg-neutral-800 
        transition text-sm inline-block">
        Upload Image
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
      </label>

      {loading && (
        <div className="text-sm text-[var(--muted)] animate-pulse">
          🔍 Analyzing image with AI...
        </div>
      )}

      {result && (
  <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4 transition-all duration-500 animate-fadeIn">
    <p className="text-xl font-semibold">{result.category}</p>

    <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full">
      <div
        className="h-2 bg-neutral-900 dark:bg-white rounded-full transition-all duration-700"
        style={{ width: `${result.confidence}%` }}
      />
    </div>

    <p className="text-sm text-[var(--muted)]">
      Confidence: {result.confidence}%
    </p>

    <p className="text-sm text-[var(--muted)]">
      CO₂ Impact: {result.co2} kg
    </p>

    <div className="pt-4 border-t border-[var(--border)] text-sm text-[var(--muted)]">
      💡 {result.smartTip}
    </div>
  </div>
)}

    </div>
  );
}
