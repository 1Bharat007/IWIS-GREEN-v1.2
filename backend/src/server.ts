import "dotenv/config";
import app from "./app";
import { initDB } from "./db";
import { vectorDB } from "./utils/vector-db.util";

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await initDB();
    
    // Initialize Semantic Search RAG Vector DB (Non-Fatal)
    try {
      await vectorDB.initialize();
    } catch (ragError) {
      console.warn("[RAG] Initialization threw an unexpected error, skipping:", ragError);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 IWIS Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
  }
};

startServer();
