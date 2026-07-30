import { sendSuccess } from "../utils/apiResponse.util";
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
      return sendSuccess(res, { reply: localReply, source: "layer-1-static" });
    }

    // 1B. Check LRU Cache for identical recent complex queries
    const cachedReply = aiCache.get(message);
    if (cachedReply) {
      return sendSuccess(res, { reply: cachedReply, source: "layer-1-cache" });
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
        finalReply = `${ragMatch.text.split("Information: ")[1]}`;
        source = "layer-3-rag";
        
        // Cache and return instantly
        aiCache.set(message, finalReply);
        return sendSuccess(res, { reply: finalReply, source });
      }
    }

    // ==========================================
    // LAYER 4: GEMINI REASONING ENGINE (STREAMED)
    // ==========================================
    
    // If we reach here, we need generative AI with SSE streaming.
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

    const TIMEOUT_MS = 15000;
    let timeoutId: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        const err: any = new Error("TIMEOUT");
        err.status = 504;
        reject(err);
      }, TIMEOUT_MS);
    });

    const geminiStreamPromise = executeWithModelRouter(
      (ai, modelName) =>
        ai.models.generateContentStream({
          model: modelName,
          contents,
          config: { systemInstruction },
        }),
      "gemini-3.5-flash", 
      ["gemini-2.5-flash", "gemini-2.0-flash-lite-001"]
    );

    const responseStream = await Promise.race([geminiStreamPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);

    // Set Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let accumulatedText = "";
    let firstChunkReceived = false;

    try {
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          firstChunkReceived = true;
          accumulatedText += text;
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
        }
      }

      if (!firstChunkReceived || !accumulatedText.trim()) {
        throw new Error("Empty response stream from AI");
      }

      // Cache the complete generative response
      aiCache.set(message, accumulatedText);

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (streamError: any) {
      console.error("[CHAT CONTROLLER STREAM ERROR]:", streamError?.message);
      res.write(`data: ${JSON.stringify({ error: streamError?.message || "Generation interrupted" })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error("========================");
    console.error("[CHAT CONTROLLER ERROR]");
    console.error("Message:", error?.message);
    console.error("Status:", error?.status);
    console.error("Stack:", error?.stack);
    console.error("========================");

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error?.message || "EcoBot error" })}\n\n`);
      res.end();
    } else {
      res.status(500).json({
        error: "EcoBot is experiencing exceptionally high demand. Please try again in a few moments.",
        retryable: true,
        debug: error?.message
      });
    }
  }
};
