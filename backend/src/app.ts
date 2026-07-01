import express from "express";
import cors from "cors";
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

const app = express();

app.use(helmet());
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
// Debug endpoint — shows Gemini config status without exposing keys
import { debugGemini } from "./controllers/debug.controller";
app.get("/api/debug/gemini", debugGemini);

app.get("/", (_, res) => {
  res.send("IWIS Backend Running");
});

// Health check endpoint — used by frontend to wake up Render free-tier server
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(errorMiddleware);

export default app;
