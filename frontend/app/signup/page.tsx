"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/session";
import { AlertIcon, LeafIcon, CheckIcon } from "@/components/ui/Icons";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

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

export default function SignupPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"citizen" | "recycler">("citizen");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("English");
  const [otp, setOtp] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !phone || !email || !password) {
      setError("Please fill in all details.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await apiFetch("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setStep(2);
    } catch (err: any) {
      setError(err.backendMessage || err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      setError("Authentication service is unavailable.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const idToken = await result.user.getIdToken(true);
        const data = await apiFetch("/auth/firebase-login", {
          method: "POST",
          body: JSON.stringify({ idToken }),
        });
        setToken(data.token);
        if (data.requiresOnboarding) {
          router.push("/recycler/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.backendMessage || err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const data = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
          phone: phone.trim(),
          displayName: displayName.trim(),
          preferredLanguage: language,
          otp
        }),
      });

      setToken(data.token);
      
      // Intelligent Redirect
      if (role === "recycler") {
        router.push("/recycler/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.backendMessage || err.message || "Signup failed.");
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
            Join thousands of users and organizations using IWIS
            to measure, manage, and scale the circular economy.
          </p>
        </div>

        <div className="space-y-3">
          {[
            "Free to use — no credit card required",
            "Verified AI waste scanning",
            "Predictable and direct pickups",
            "Generate ESG impact reports",
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
              Create your account
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {step === 1 ? "Get started with IWIS in seconds." : `We sent an OTP to ${phone}`}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3.5 py-3 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-bg)] text-sm text-[var(--destructive)]">
              <AlertIcon size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <button 
                type="button" 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full mb-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">or sign up with phone</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setRole("citizen")}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      role === "citizen" 
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)] ring-1 ring-[var(--accent)]" 
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${role === "citizen" ? "text-[var(--accent-text)]" : "text-[var(--text-primary)]"}`}>Sell Waste</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        role === "citizen" ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)]"
                      }`}>
                        {role === "citizen" && <CheckIcon size={10} className="text-white" />}
                      </div>
                    </div>
                    <span className="text-2xs text-[var(--text-secondary)]">For households & businesses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("recycler")}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      role === "recycler" 
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)] ring-1 ring-[var(--accent)]" 
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${role === "recycler" ? "text-[var(--accent-text)]" : "text-[var(--text-primary)]"}`}>Collect Waste</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        role === "recycler" ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)]"
                      }`}>
                        {role === "recycler" && <CheckIcon size={10} className="text-white" />}
                      </div>
                    </div>
                    <span className="text-2xs text-[var(--text-secondary)]">For local Kabadiwalas</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Full Name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      required
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Preferred Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 appearance-none"
                  >
                    <option value="English">English</option>
                    <option value="हिन्दी">हिन्दी</option>
                    <option value="Dogri">Dogri</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
                >
                  {loading ? "Sending OTP..." : "Continue"}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifySignup} className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Enter 6-digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center text-lg tracking-widest outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-[var(--text-tertiary)] text-center">Check the backend console for the OTP.</p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-2.5 px-4 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? "Verifying..." : "Create Account"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Back
                </button>
            </form>
          )}

          {step === 1 && (
            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--accent-text)] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
