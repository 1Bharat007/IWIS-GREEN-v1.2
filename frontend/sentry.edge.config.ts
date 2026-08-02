/**
 * sentry.edge.config.ts — Edge runtime Sentry initialization for Next.js.
 *
 * Runs in middleware and edge API routes.
 * Imported via instrumentation.ts register() when NEXT_RUNTIME === 'edge'.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    release: `iwis-frontend@${process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}`,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}
