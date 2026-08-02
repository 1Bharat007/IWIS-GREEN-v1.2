/**
 * sentry.client.config.ts — Client-side Sentry initialization for Next.js App Router.
 *
 * This file is imported by instrumentation-client.ts and runs in the browser.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    release: `iwis-frontend@${process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}`,

    // Sample 100% of errors, 10% of performance traces in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Replay configuration for debugging UI issues
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // Scrub sensitive data before sending to Sentry
    beforeSend(event) {
      // Strip cookies and authorization from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data?.headers) {
            delete breadcrumb.data.headers["Authorization"];
            delete breadcrumb.data.headers["Cookie"];
          }
          return breadcrumb;
        });
      }
      return event;
    },
  });
} else {
  if (process.env.NODE_ENV === "production") {
    console.warn("[sentry] NEXT_PUBLIC_SENTRY_DSN is not set — client-side error tracking is disabled in production.");
  }
}
