import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { handleChat } from "../controllers/chat.controller";
import { executeWithGeminiFallback } from "../utils/gemini.util";

const router = Router();

router.post("/", protect, handleChat);

router.get("/test-gemini", async (req, res) => {
  try {
    const keys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter(Boolean) as string[];

    const keysCount = keys.length;
    const keysMasked = keys.map(k => `...${k.slice(-4)}`);

    const result = await executeWithGeminiFallback(async (ai) => {
      return await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'Say Hello!',
      });
    });

    res.json({
      success: true,
      text: result.text,
      keysCount,
      keysMasked,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || error,
      stack: error.stack,
      envKeysCount: [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
      ].filter(Boolean).length,
    });
  }
});

export default router;
