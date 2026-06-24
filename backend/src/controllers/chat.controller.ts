import { Request, Response } from "express";
import { executeWithModelRouter } from "../utils/ai-router.util";
import { getLocalResponse } from "../utils/local-kb.util";

export const handleChat = async (req: any, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // 1. Local Knowledge Base Check (Instant Response)
    const localReply = getLocalResponse(message);
    if (localReply) {
      // Simulate slight human-like typing delay (optional, but good UX for instant bots)
      await new Promise((resolve) => setTimeout(resolve, 300));
      return res.json({ reply: localReply });
    }

    // 2. Prepare Gemini Prompt
    const systemInstruction = `You are EcoBot, a helpful AI assistant for the IWIS (Integrated Waste Intelligence System) platform. 
Your purpose is to help users with: climate change, environmental sustainability, recycling best practices, waste management, eco-friendly habits, and how to earn/use Green Points in IWIS.
Keep responses concise (2-4 sentences), factual, and actionable.
If asked about something completely unrelated to the environment or IWIS (e.g., coding help, movies, math), politely decline and steer back to eco topics.
Always be encouraging and positive about green actions.`;

    // Build conversation history
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (!msg.text || !msg.text.trim()) continue;
        const safeRole = msg.role === "user" ? "user" : "model";
        if (contents.length > 0 && contents[contents.length - 1].role === safeRole) {
          contents[contents.length - 1].parts[0].text += `\n\n${msg.text}`;
        } else {
          contents.push({ role: safeRole, parts: [{ text: msg.text }] });
        }
      }
    }

    // Push the current user message
    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      contents[contents.length - 1].parts[0].text += `\n\n${message}`;
    } else {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    // 3. Execute with AI Router
    // 15s timeout per attempt, allowing failovers to trigger quickly
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        const err: any = new Error("TIMEOUT");
        err.status = 504; // Mark as retryable for the router
        reject(err);
      }, 15000)
    );

    const geminiPromise = executeWithModelRouter(
      (ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction },
        }),
      "gemini-3.5-flash", // Primary
      ["gemini-2.5-flash", "gemini-2.0-flash-lite-001"] // Fallbacks
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const replyText = (response as any).text;

    if (!replyText) {
      throw new Error("Empty response from AI");
    }

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("========================");
    console.error("[CHAT CONTROLLER ERROR]");
    console.error("Message:", error?.message);
    console.error("Status:", error?.status);
    console.error("Stack:", error?.stack);
    console.error("========================");

    // If we reach here, ALL models and ALL retries failed.
    const userFriendlyError = "EcoBot is experiencing exceptionally high demand. Please try again in a few moments.";

    res.status(500).json({
      error: userFriendlyError,
      retryable: true,
      debug: error?.message
    });
  }
};
