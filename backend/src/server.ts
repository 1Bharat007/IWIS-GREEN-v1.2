import "dotenv/config";
import app from "./app";
import { initDB } from "./db";

const PORT = 5000;

const startServer = async () => {
  try {
    await initDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 IWIS Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
  }
};

startServer();
