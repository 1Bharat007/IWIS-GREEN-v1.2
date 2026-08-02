/**
 * instrumentation-client.ts — Client-side instrumentation hook for Next.js 16.
 *
 * Loads the client-side Sentry config for browser error tracking and
 * exports the router transition hook for navigation instrumentation.
 */

import * as Sentry from "@sentry/nextjs";

import "./sentry.client.config";

// Required by @sentry/nextjs to instrument App Router navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
