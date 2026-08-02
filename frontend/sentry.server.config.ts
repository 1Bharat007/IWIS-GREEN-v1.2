/**
 * sentry.server.config.ts — Server-side Sentry initialization for Next.js.
 *
 * Runs in the Node.js runtime (Server Components, API routes, SSR).
 * Imported via instrumentation.ts register() when NEXT_RUNTIME === 'nodejs'.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    release: `iwis-frontend@${process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}`,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Scrub PII — never send full request bodies or auth tokens
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      if (event.request?.data) {
        event.request.data = "[Filtered]";
      }
      return event;
    },
  });
} else {
  if (process.env.NODE_ENV === "production") {
    console.warn("[sentry] NEXT_PUBLIC_SENTRY_DSN is not set — server-side error tracking is disabled.");
  }
}
