"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/session";
import { AlertIcon, ArrowRightIcon, LeafIcon, CheckIcon } from "@/components/ui/Icons";

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

type StrengthLevel = "empty" | "weak" | "fair" | "strong" | "very-strong";

function getStrength(pwd: string): StrengthLevel {
  if (!pwd) return "empty";
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score === 3) return "strong";
  return "very-strong";
}

const STRENGTH_CONFIG: Record<StrengthLevel, { label: string; color: string; bars: number }> = {
  empty:       { label: "",            color: "bg-[var(--border)]",      bars: 0 },
  weak:        { label: "Weak",        color: "bg-[var(--destructive)]", bars: 1 },
  fair:        { label: "Fair",        color: "bg-[var(--warning)]",     bars: 2 },
  strong:      { label: "Strong",      color: "bg-[var(--accent)]",      bars: 3 },
  "very-strong": { label: "Very strong", color: "bg-[var(--accent)]",   bars: 4 },
};

export default function SignupPage() {
  const router = useRouter();
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const strength = useMemo(() => getStrength(password), [password]);
  const strengthCfg = STRENGTH_CONFIG[strength];

  const requirements = [
    { met: password.length >= 8,       label: "At least 8 characters" },
    { met: /[A-Z]/.test(password),     label: "One uppercase letter" },
    { met: /[0-9]/.test(password),     label: "One number" },
    { met: /[^A-Za-z0-9]/.test(password), label: "One special character (optional, strengthens security)" },
  ];

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordsMismatch) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setToken(data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.backendMessage || err.message || "Could not create account. Please try again.");
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
            Start tracking your<br />environmental impact.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Join thousands of citizens, municipalities, and ESG teams using IWIS
            to measure, manage, and report on waste reduction.
          </p>
        </div>

        <div className="space-y-3">
          {[
            "Free to use — no credit card required",
            "AI waste scanner from day one",
            "Earn Green Points on every scan",
            "Generate ESG reports instantly",
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
            <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
              Create your account
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Get started with IWIS in seconds.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3.5 py-3 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
              <AlertIcon size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
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

              {/* Strength meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          bar <= strengthCfg.bars ? strengthCfg.color : "bg-[var(--border)]"
                        }`}
                      />
                    ))}
                    <span className="text-2xs text-[var(--text-tertiary)] ml-2 w-16 text-right shrink-0 self-center">
                      {strengthCfg.label}
                    </span>
                  </div>

                  {/* Requirements checklist */}
                  <div className="space-y-1">
                    {requirements.slice(0, 3).map((req) => (
                      <div key={req.label} className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          req.met
                            ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]"
                            : "bg-[var(--surface-raised)] text-[var(--text-tertiary)]"
                        }`}>
                          {req.met
                            ? <CheckIcon size={8} />
                            : <span className="w-1 h-1 rounded-full bg-current" />}
                        </span>
                        <span className={`text-2xs transition-colors ${req.met ? "text-[var(--accent-text)]" : "text-[var(--text-tertiary)]"}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="signup-confirm" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 pr-10 rounded-lg border bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 transition-colors ${
                    passwordsMismatch
                      ? "border-[var(--destructive)] focus:ring-[var(--destructive)]/15 focus:border-[var(--destructive)]"
                      : passwordsMatch
                      ? "border-[var(--accent)] focus:ring-[var(--accent)]/15"
                      : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-[var(--accent)]/15"
                  }`}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="mt-1 text-2xs text-[var(--destructive)]">Passwords do not match.</p>
              )}
              {passwordsMatch && (
                <p className="mt-1 text-2xs text-[var(--accent-text)]">Passwords match.</p>
              )}
            </div>

            <button
              type="submit"
              id="signup-submit"
              disabled={loading || passwordsMismatch || password.length < 8}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <>
                  Create account
                  <ArrowRightIcon size={13} />
                </>
              )}
            </button>

            <p className="text-xs text-[var(--text-tertiary)] text-center leading-relaxed">
              By creating an account you agree to our{" "}
              <Link href="/" className="underline hover:text-[var(--text-secondary)] transition-colors">
                Terms of Service
              </Link>
              .
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--accent-text)] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
