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
      const allowed = [
        "http://localhost:3000",
        process.env.FRONTEND_URL, // e.g. https://iwis-green-v103.vercel.app
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
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
