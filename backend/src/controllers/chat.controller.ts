import { Request, Response } from "express";
import { executeWithModelRouter } from "../utils/ai-router.util";
import { getLocalResponse } from "../utils/local-kb.util";
import { aiCache } from "../utils/cache.util";
import { vectorDB } from "../utils/vector-db.util";

/**
 * Basic local intent classifier to decide if we should skip RAG and go straight to Gemini
 * (e.g., highly personalized/complex reasoning tasks).
 */
function needsComplexReasoning(message: string): boolean {
  const msg = message.toLowerCase();
  const reasoningKeywords = [
    "compare", "calculate", "analyze", "what if", "scenario",
    "recommend", "advise", "i live in", "my city", "my house"
  ];
  return reasoningKeywords.some(kw => msg.includes(kw)) && msg.length > 50;
}

export const handleChat = async (req: any, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // ==========================================
    // LAYER 1: INSTANT RESPONSE ENGINE & CACHE
    // ==========================================
    
    // 1A. Check static local KB (Greetings, Praise, Core FAQs)
    const localReply = getLocalResponse(message);
    if (localReply) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // slight natural delay
      return res.json({ reply: localReply, source: "layer-1-static" });
    }

    // 1B. Check LRU Cache for identical recent complex queries
    const cachedReply = aiCache.get(message);
    if (cachedReply) {
      return res.json({ reply: cachedReply, source: "layer-1-cache" });
    }

    let finalReply = "";
    let source = "layer-4-gemini";

    // Intent Classification: Should we try RAG first?
    const requiresReasoning = needsComplexReasoning(message);

    // ==========================================
    // LAYER 3: SEMANTIC SEARCH (RAG)
    // ==========================================
    if (!requiresReasoning) {
      // Threshold 0.82 is usually good for sentence-level semantic similarity in text-embedding-004
      const ragMatch = await vectorDB.search(message, 0.82);
      
      if (ragMatch) {
        // High confidence match! We return the knowledge chunk directly.
        // The markdown chunks are pre-formatted to be readable.
        finalReply = `${ragMatch.text.split("Information: ")[1]}`;
        source = "layer-3-rag";
        
        // Cache and return instantly
        aiCache.set(message, finalReply);
        return res.json({ reply: finalReply, source });
      }
    }

    // ==========================================
    // LAYER 4: GEMINI REASONING ENGINE
    // ==========================================
    
    // If we reach here, we need generative AI.
    const systemInstruction = `You are EcoBot, a helpful AI assistant for the IWIS (Integrated Waste Intelligence System) platform. 
Your purpose is to help users with: climate change, environmental sustainability, recycling best practices, waste management, eco-friendly habits, and how to earn/use Green Points in IWIS.
Keep responses concise (2-4 sentences), factual, and actionable.
If asked about something completely unrelated to the environment or IWIS, politely decline and steer back to eco topics.
Always be encouraging and positive.`;

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

    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      contents[contents.length - 1].parts[0].text += `\n\n${message}`;
    } else {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        const err: any = new Error("TIMEOUT");
        err.status = 504; 
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
      "gemini-3.5-flash", 
      ["gemini-2.5-flash", "gemini-2.0-flash-lite-001"]
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    finalReply = (response as any).text;

    if (!finalReply) {
      throw new Error("Empty response from AI");
    }

    // Cache the expensive generative response
    aiCache.set(message, finalReply);

    res.json({ reply: finalReply, source });
  } catch (error: any) {
    console.error("========================");
    console.error("[CHAT CONTROLLER ERROR]");
    console.error("Message:", error?.message);
    console.error("Status:", error?.status);
    console.error("Stack:", error?.stack);
    console.error("========================");

    res.status(500).json({
      error: "EcoBot is experiencing exceptionally high demand. Please try again in a few moments.",
      retryable: true,
      debug: error?.message
    });
  }
};
