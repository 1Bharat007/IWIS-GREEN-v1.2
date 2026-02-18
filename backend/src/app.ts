import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import wasteRoutes from "./routes/waste.routes";
import { initDB } from "./db";

const app = express();

initDB();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Increase body size for base64 image
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/waste", wasteRoutes);

app.get("/", (_, res) => {
  res.send("IWIS Backend Running");
});

export default app;
