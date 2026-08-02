/**
 * instrument.ts — Sentry SDK initialization for the backend.
 *
 * MUST be imported at the very top of server.ts BEFORE any other imports
 * so that Sentry's auto-instrumentation hooks into Express, pg, etc.
 *
 * Sentry initialization is ADDITIVE — if the DSN is missing in dev or
 * if Sentry's service is unreachable, the app logs a warning and
 * continues serving requests normally. In production (NODE_ENV=production),
 * a missing SENTRY_DSN causes a loud startup error.
 */

import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;
const isProd = process.env.NODE_ENV === "production";

if (!dsn) {
  if (isProd) {
    // Fail loud in production — same pattern as CLERK_SECRET_KEY validation
    throw new Error(
      "SENTRY_DSN is not set — refusing to start in production without error tracking. " +
        "Add SENTRY_DSN to your environment variables."
    );
  } else {
    console.warn(
      "[sentry] SENTRY_DSN is not set — Sentry error tracking is disabled in development. " +
        "Set SENTRY_DSN in backend/.env to enable it."
    );
  }
}

if (dsn) {
  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      release: `iwis-backend@${process.env.npm_package_version || "1.0.0"}`,

      // Sample 100% of errors, 10% of performance traces in production
      tracesSampleRate: isProd ? 0.1 : 1.0,

      // Scrub sensitive data — never send auth tokens or full request bodies
      beforeSend(event) {
        // Strip Authorization headers from request data
        if (event.request?.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
        }
        // Strip request body to avoid PII leakage (DPDP Act consideration)
        if (event.request?.data) {
          event.request.data = "[Filtered]";
        }
        return event;
      },
    });
    console.log("[sentry] ✅ Sentry initialized successfully");
  } catch (err) {
    // Never let Sentry init crash the app — it's additive observability
    console.warn("[sentry] ⚠️ Sentry initialization failed, continuing without error tracking:", err);
  }
}

export { Sentry };
