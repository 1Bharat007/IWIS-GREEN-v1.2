/**
 * instrumentation.ts — Next.js instrumentation hook (App Router).
 *
 * This file is the standard entry point for server-side observability in Next.js 16.
 * It loads Sentry's server/edge configs based on the runtime, and exports
 * onRequestError to capture server-side rendering errors.
 */

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
