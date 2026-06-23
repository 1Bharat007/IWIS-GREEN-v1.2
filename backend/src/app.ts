import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import wasteRoutes from "./routes/waste.routes";
import chatRoutes from "./routes/chat.routes";
import marketplaceRoutes from "./routes/marketplace.routes";
import { initDB } from "./db";

const app = express();

initDB();

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
app.use("/api/marketplace", marketplaceRoutes);

app.get("/", (_, res) => {
  res.send("IWIS Backend Running");
});

export default app;
