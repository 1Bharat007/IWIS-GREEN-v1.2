"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/session";
import { AlertIcon } from "@/components/ui/Icons";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { AuthLoadingState } from "@/components/ui/AuthLoadingState";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

function EyeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

function EyeOffIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const redirectUser = (data: any) => {
    sessionStorage.setItem("justLoggedIn", "true");
    if (data.role === "recycler") {
      router.push("/recycler/feed");
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      if (!auth) {
        throw new Error("Firebase Auth is not configured");
      }
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const _data = await apiFetch("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken, role: "citizen" }),
      });
        const data = _data.data || _data;
      setToken(data.token);
      redirectUser(data);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }
      console.error(err);
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  const validate = () => {
    let isValid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError("");
    }
    
    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else {
      setPasswordError("");
    }
    return isValid;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      setError("");
      const _data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
        const data = _data.data || _data;
      setToken(data.token);
      redirectUser(data);
    } catch (err: any) {
      let msg = err.message || "Unable to reach our servers. Please check your connection.";
      if (err.status === 401) {
        msg = "Incorrect email or password.";
      } else if (err.status >= 500) {
        msg = "Something went wrong. Please try again.";
      }
      setError(msg);
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
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {loading && <AuthLoadingState />}
        <div className={`w-full max-w-sm transition-opacity duration-300 ${loading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

          <div className="mb-7">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">
              Sign in to IWIS
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Welcome back! Please enter your details.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3.5 py-3 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)] animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertIcon size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <Button
            variant="secondary"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mb-6"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">OR CONTINUE WITH EMAIL</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5" noValidate>
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

            <div className="relative">
              <Input
                label="Password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                error={passwordError}
                autoComplete="current-password"
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
              <Link href="/forgot-password" className="text-xs text-[var(--accent-text)] hover:underline absolute right-0 top-0">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="mt-2"
            >
              Sign in
            </Button>
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
