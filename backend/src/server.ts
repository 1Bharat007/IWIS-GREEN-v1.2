import "dotenv/config";
import app from "./app";
import { initDB } from "./db";
import { vectorDB } from "./utils/vector-db.util";

const PORT = Number(process.env.PORT) || 5000;

const validateStartup = async () => {
  const clerkKey = process.env.CLERK_SECRET_KEY;
  if (!clerkKey || (!clerkKey.startsWith("sk_test_") && !clerkKey.startsWith("sk_live_"))) {
    throw new Error("CLERK_SECRET_KEY is missing or malformed — check backend/.env");
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.trim().length === 0) {
    throw new Error("GEMINI_API_KEY is missing — check backend/.env");
  }

  const db = await initDB();
  const columns = await db.all("PRAGMA table_info(users)");
  const hasClerkId = Array.isArray(columns) && columns.some((col: any) => col.name === "clerkId");
  if (!hasClerkId) {
    throw new Error("users.clerkId column missing — migration did not apply, check backend/src/db.ts logs above");
  }

  console.log("✅ Startup validation passed");
};

const startServer = async () => {
  try {
    await initDB();
    
    // Initialize Semantic Search RAG Vector DB (Non-Fatal)
    try {
      await vectorDB.initialize();
    } catch (ragError) {
      console.warn("[RAG] Initialization threw an unexpected error, skipping:", ragError);
    }

    await validateStartup();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 IWIS Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
  }
};

startServer();
