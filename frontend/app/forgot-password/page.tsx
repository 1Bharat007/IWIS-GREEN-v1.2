"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[0%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md animate-fadeIn z-10">
        <div className="rounded-3xl border border-white/20 bg-white/60 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">

          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
              <span className="text-3xl">🔑</span>
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
              Forgot Password?
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          {/* Success state */}
          {success ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-4xl">
                📬
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  Check your inbox!
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {email}
                  </span>
                  . The link expires in 1 hour.
                </p>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Didn't get it? Check your spam folder or{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/login"
                className="inline-block rounded-xl border border-neutral-200 dark:border-neutral-700 px-6 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-neutral-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                id="send-reset-btn"
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-70 dark:bg-white dark:text-black mt-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? "Sending..." : "Send Reset Link"}
                  {!loading && <span className="transition-transform group-hover:translate-x-1">→</span>}
                </span>
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
