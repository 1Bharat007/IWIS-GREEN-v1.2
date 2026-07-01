"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { AlertIcon, LeafIcon } from "@/components/ui/Icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    let isValid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError("");
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      setError("");
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
    } catch (err: any) {
      let msg = err.message || "Unable to reach our servers. Please check your connection.";
      if (err.status >= 500) {
        msg = "Something went wrong. Please try again.";
      }
      setError(msg);
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
            Secure and reliable<br />access recovery.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Get back to managing your environmental impact in just a few clicks.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
            <span className="w-4 h-4 rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
              <LeafIcon size={9} className="text-[var(--accent-text)]" />
            </span>
            Secure email verification
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-sm">

          <div className="mb-7">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">
              Forgot Password
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Enter your email and we'll send a reset link.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3.5 py-3 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)] animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertIcon size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto w-16 h-16 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center text-2xl">
                📬
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Check your inbox!
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-[var(--text-primary)]">{email}</span>. The link expires in 1 hour.
                </p>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Didn't get it? Check your spam folder or{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-[var(--accent-text)] hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                error={emailError}
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="mt-2"
              >
                Send Reset Link
              </Button>

              <div className="text-center mt-6">
                <Link
                  href="/login"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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
