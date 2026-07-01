"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { AlertIcon, LeafIcon, CheckIcon } from "@/components/ui/Icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  const validate = () => {
    let isValid = true;
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      isValid = false;
    } else {
      setPasswordError("");
    }
    
    if (password !== confirm) {
      setConfirmError("Passwords do not match.");
      isValid = false;
    } else {
      setConfirmError("");
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
      let msg = err.message || "Unable to reach our servers. Please check your connection.";
      if (err.status >= 500) {
        msg = "Something went wrong. Please try again.";
      }
      setError(msg);
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-[var(--destructive)]", "bg-yellow-500", "bg-[var(--accent)]"][strength];

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
            Set a new password.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Please choose a strong password to secure your account.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
            <span className="w-4 h-4 rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
              <LeafIcon size={9} className="text-[var(--accent-text)]" />
            </span>
            Secure authentication
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-sm">

          <div className="mb-7">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">
              Reset Password
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Choose a strong password for your IWIS account.
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
                <CheckIcon size={24} className="text-[var(--accent-text)]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Password Updated!
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Your password has been reset successfully. Redirecting you to sign in...
                </p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--surface-raised)] overflow-hidden">
                <div className="h-full bg-[var(--accent)] animate-[progress_3s_linear_forwards]" style={{width:"100%"}} />
              </div>
              <Link
                href="/login"
                className="inline-block mt-4 text-sm font-medium text-[var(--accent-text)] hover:underline"
              >
                Go to Sign In →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              
              <div>
                <Input
                  label="New Password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                    if (confirmError && e.target.value === confirm) setConfirmError("");
                  }}
                  error={passwordError}
                  autoComplete="new-password"
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="hover:text-[var(--text-secondary)] transition-colors"
                      tabIndex={-1}
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                    </button>
                  }
                />
                
                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength ? strengthColor : "bg-[var(--surface-raised)]"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Strength:{" "}
                      <span className={strength === 3 ? "text-[var(--accent-text)]" : strength === 2 ? "text-yellow-500" : "text-[var(--destructive)]"}>
                        {strengthLabel}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type={showPwd ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (confirmError) setConfirmError("");
                }}
                error={confirmError}
                success={!!(confirm && confirm === password && password.length >= 8)}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!token}
                className="mt-2"
              >
                Update Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
