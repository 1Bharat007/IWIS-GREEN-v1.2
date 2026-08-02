"use client";

/**
 * global-error.tsx — Next.js App Router global error boundary.
 *
 * This component catches unhandled errors in the root layout and all pages.
 * It reports errors to Sentry and shows a fallback UI to the user.
 */

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "Inter, system-ui, sans-serif",
          background: "#0a0a0a",
          color: "#fafafa",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480, padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
            An unexpected error occurred. Our team has been notified and is
            working on a fix.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
