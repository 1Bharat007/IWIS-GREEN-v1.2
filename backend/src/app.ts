import express from "express";
import cors from "cors";
import * as Sentry from "@sentry/node";
import authRoutes from "./routes/auth.routes";
import wasteRoutes from "./routes/waste.routes";
import chatRoutes from "./routes/chat.routes";
import recyclerRoutes from "./routes/recycler.routes";
import listingRoutes from "./routes/listing.routes";
import priceRoutes from "./routes/price.routes";
import transactionRoutes from "./routes/transaction.routes";
import notificationRoutes from "./routes/notification.routes";
import analyticsRoutes from "./routes/analytics.routes";
import municipalityRoutes from "./routes/municipality.routes";
import errorMiddleware from "./middleware/error.middleware";
import { requestLogger } from "./middleware/logger.middleware";
import { standardLimiter } from "./middleware/rateLimit.middleware";
import helmet from "helmet";
import { clerkMiddleware } from "@clerk/express";

const app = express();

const isProd = process.env.NODE_ENV === "production";
const scriptSrc = ["'self'", "'unsafe-inline'", "https://*.clerk.accounts.dev"];
if (!isProd) {
  scriptSrc.push("'unsafe-eval'");
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc,
        connectSrc: ["'self'", "https://*.clerk.accounts.dev", "https://api.clerk.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://img.clerk.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:"],
        frameSrc: ["'self'", "https://*.clerk.accounts.dev"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  })
);
app.use(requestLogger);
app.use(standardLimiter);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = [
        "http://localhost:3000",
        "https://iwis-green-v103.vercel.app",
      ];

      if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }

      // Normalize all allowed origins by removing trailing slashes
      const normalizedAllowed = allowedOrigins
        .filter(Boolean)
        .map((url) => url.replace(/\/$/, ""));

      const normalizedOrigin = origin.replace(/\/$/, "");

      const isAllowed =
        normalizedAllowed.includes(normalizedOrigin) ||
        /^https:\/\/iwis-green.*\.vercel\.app$/.test(normalizedOrigin) ||
        /^http:\/\/localhost:\d+$/.test(normalizedOrigin);

      if (isAllowed) {
        callback(null, true);
      } else {
        // Set to false rather than throwing a 500 error on the server
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Increase body size for base64 image
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

if (!secretKey) {
  throw new Error("CLERK_SECRET_KEY is not set — refusing to start.");
}

app.use(clerkMiddleware({ publishableKey, secretKey }));

// ─── Sentry Per-Request Context ───────────────────────────────────────────
// Attach request ID and user ID to Sentry scope for every request.
// Deliberately minimal PII: only user ID, never email/tokens.
app.use((req: any, _res, next) => {
  Sentry.withScope((scope) => {
    // Request ID from logger.middleware.ts
    if (req.id) {
      scope.setTag("requestId", req.id);
    }
    // User ID from auth middleware (when authenticated)
    if (req.user?.id) {
      scope.setUser({ id: req.user.id });
    }
  });
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/waste", wasteRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/recycler", recyclerRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/municipality", municipalityRoutes);
// Debug endpoint — shows Gemini config status without exposing keys (development only)
import { debugGemini } from "./controllers/debug.controller";
if (process.env.NODE_ENV !== "production") {
  app.get("/api/debug/gemini", debugGemini);
}

app.get("/", (_, res) => {
  res.send("IWIS Backend Running");
});

// Health check endpoint — used by frontend to wake up Render free-tier server
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Sentry Error Handler (MUST come BEFORE the app's own error handler) ──
// In Sentry v9, Sentry.setupExpressErrorHandler() registers a proper Express
// error-handling middleware that captures exceptions and forwards them to next().
Sentry.setupExpressErrorHandler(app);

// Global Error Handler (app's own — runs AFTER Sentry captures the error)
app.use(errorMiddleware);

export default app;
