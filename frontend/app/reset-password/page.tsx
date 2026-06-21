"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-emerald-500"][strength];

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[0%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md animate-fadeIn z-10">
        <div className="rounded-3xl border border-white/20 bg-white/60 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">

          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
              <span className="text-3xl">🔒</span>
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
              Set New Password
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Choose a strong password for your IWIS account.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success state */}
          {success ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-4xl">
                ✅
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  Password Updated!
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Your password has been reset successfully. Redirecting you to sign in...
                </p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-[progress_3s_linear_forwards]" style={{width:"100%"}} />
              </div>
              <Link
                href="/login"
                className="inline-block rounded-xl bg-neutral-900 dark:bg-white px-6 py-2.5 text-sm font-medium text-white dark:text-black hover:opacity-90 transition-opacity"
              >
                Go to Sign In →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-white/50 px-4 py-3.5 pr-12 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors text-sm"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength ? strengthColor : "bg-neutral-200 dark:bg-neutral-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Strength:{" "}
                      <span className={strength === 3 ? "text-emerald-500" : strength === 2 ? "text-yellow-500" : "text-red-500"}>
                        {strengthLabel}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className={`w-full rounded-xl border bg-white/50 px-4 py-3.5 text-sm outline-none transition-all focus:ring-2 dark:bg-neutral-800/50 dark:text-white ${
                    confirm && confirm !== password
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                      : confirm && confirm === password
                      ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-neutral-200 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-neutral-700/50 dark:focus:border-emerald-500"
                  }`}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {confirm && confirm !== password && (
                  <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
                )}
                {confirm && confirm === password && (
                  <p className="mt-1 text-xs text-emerald-500">✓ Passwords match</p>
                )}
              </div>

              <button
                id="reset-password-btn"
                type="submit"
                disabled={loading || !token}
                className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-70 dark:bg-white dark:text-black mt-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? "Updating..." : "Update Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[90vh] items-center justify-center">
        <div className="text-neutral-400 text-sm">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
