"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/session";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setToken(data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="mb-6 text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Create Account
        </h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mb-6 w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-black hover:underline dark:text-white"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
