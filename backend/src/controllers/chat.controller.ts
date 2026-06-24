import { Request, Response } from "express";
import { executeWithGeminiFallback } from "../utils/gemini.util";

export const handleChat = async (req: any, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

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

    // 60 second timeout for Gemini
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 60000)
    );

    const geminiPromise = executeWithGeminiFallback((ai) =>
      ai.models.generateContent({
        model: "gemini-flash-latest",
        contents,
        config: { systemInstruction },
      })
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const replyText = (response as any).text;

    if (!replyText) {
      throw new Error("Empty response from AI");
    }

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Chat Error:", error?.message || error);

    if (error?.message === "TIMEOUT") {
      return res.status(504).json({
        error: "EcoBot took too long to respond. Please try again.",
        retryable: true,
      });
    }

    res.status(500).json({
      error: `[Backend Error] ${error?.message || "Unknown server error"}`,
      retryable: true,
    });
  }
};
