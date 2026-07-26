import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function testEmbedding() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const modelsToTest = [
    "models/gemini-embedding-001",
    "gemini-embedding-001",
    "models/gemini-embedding-2-preview",
    "models/gemini-embedding-2"
  ];

  for (const m of modelsToTest) {
    try {
      const res = await ai.models.embedContent({
        model: m,
        contents: "Test recycling waste text",
      });
      console.log(`✅ SUCCESS for "${m}": vector size = ${res.embeddings?.[0]?.values?.length}`);
      return;
    } catch (err: any) {
      console.log(`❌ FAILED for "${m}":`, err?.message || err);
    }
  }
}

testEmbedding();
