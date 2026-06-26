"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/session";
import { AlertIcon, ArrowRightIcon, LeafIcon } from "@/components/ui/Icons";

function EyeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-10-7-10-7a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState(""); // Email or Phone
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your email or phone, and password.");
      return;
    }
    
    // Auto-detect if it's an email or phone number
    const isEmail = identifier.includes("@");
    const payload = isEmail 
      ? { email: identifier.trim(), password }
      : { phone: identifier.trim(), password };

    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      setToken(data.token);
      
      // Intelligent Redirect
      const redirectParam = searchParams.get("redirect");
      
      if (redirectParam) {
        router.push(decodeURIComponent(redirectParam));
      } else if (data.role === "recycler") {
        if (data.requiresOnboarding) {
          router.push("/recycler/onboarding");
        } else {
          router.push("/recycler/feed");
        }
      } else {
        router.push("/dashboard");
      }
      
    } catch (err: any) {
      setError(err.backendMessage || err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] flex">

      {/* ── Left brand panel ─────────────────────────────────── */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between border-r border-[var(--border)] px-10 py-12 bg-[var(--surface-raised)]">
        <div>
          <div className="flex items-center gap-2 mb-10">
            <span className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">IW</span>
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">IWIS</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3 leading-snug">
            Waste intelligence<br />for the real world.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Track your environmental impact, discover recyclers, and participate in India's leading circular economy network.
          </p>
        </div>

        <div className="space-y-3">
          {[
            "India's largest recycling network",
            "Scope 3 carbon tracking",
            "AI waste classification",
            "Direct local pickups",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <span className="w-4 h-4 rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
                <LeafIcon size={9} className="text-[var(--accent-text)]" />
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <div className="mb-7">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">
              Sign in to IWIS
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Welcome back! Please enter your details.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3.5 py-3 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
              <AlertIcon size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Google Coming Soon */}
          <button 
            type="button" 
            disabled 
            className="w-full mb-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text-primary)] opacity-60 cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google (Coming Soon)
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">or sign in with email/phone</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Email or Phone Number
              </label>
              <input
                id="identifier"
                type="text"
                placeholder="you@example.com or 9876543210"
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-colors"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-[var(--accent-text)] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  tabIndex={-1}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>
                  Sign in
                  <ArrowRightIcon size={13} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[var(--accent-text)] font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-48px)] flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
