import { Request, Response } from "express";
import { executeWithGeminiFallback } from "../utils/gemini.util";

export const handleChat = async (req: any, res: Response) => {
  try {
    // AI instance is provided by the fallback wrapper
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const systemInstruction = `You are EcoBot, a helpful AI assistant. 
Your sole purpose is to discuss climate change, environmental sustainability, recycling, and eco-friendly practices. 
You must keep your responses extremely concise, limited to 2-3 sentences at most, providing only factual data. 
If the user asks about anything unrelated to the environment (e.g., coding, math, general chatting, movies, etc.), politely decline and steer the conversation back to climate topics.`;
    
    // We pass history if available
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (!msg.text || !msg.text.trim()) continue; // Skip empty text
        const safeRole = msg.role === 'user' ? 'user' : 'model';
        
        // Prevent consecutive same-roles which crash Gemini
        if (contents.length > 0 && contents[contents.length - 1].role === safeRole) {
           contents[contents.length - 1].parts[0].text += `\n\n${msg.text}`;
        } else {
          contents.push({
            role: safeRole,
            parts: [{ text: msg.text }]
          });
        }
      }
    }
    
    // Push the final user message
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n\n${message}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    const response = await executeWithGeminiFallback((ai) =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
        }
      })
    );

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Failed to generate response." });
  }
};
