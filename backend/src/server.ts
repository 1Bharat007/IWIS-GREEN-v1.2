import "dotenv/config";
import app from "./app";
import { initDB } from "./db";
import { vectorDB } from "./utils/vector-db.util";

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await initDB();
    
    // Initialize Semantic Search RAG Vector DB
    await vectorDB.initialize();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 IWIS Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
  }
};

startServer();
