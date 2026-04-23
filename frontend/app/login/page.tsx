"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setToken(data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[0%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md animate-fadeIn z-10">
        <div className="rounded-3xl border border-white/20 bg-white/60 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Sign in to continue to <span className="font-semibold text-emerald-600 dark:text-emerald-400">IWIS</span>.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-neutral-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="mb-1.5 flex justify-between">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                <Link href="#" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-neutral-200 bg-white/50 px-4 py-3.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:text-white dark:focus:border-emerald-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-70 dark:bg-white dark:text-black mt-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <span className="transition-transform group-hover:translate-x-1">→</span>}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Don’t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
