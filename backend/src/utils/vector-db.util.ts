import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

interface Chunk {
  id: string;
  sourceFile: string;
  category: string;
  text: string;
  embedding?: number[];
}

class VectorDB {
  private chunks: Chunk[] = [];
  private ai: GoogleGenAI;
  private isInitialized = false;

  constructor() {
    // Note: This uses the first key. For production robustness, 
    // it could use the rotation logic, but embedding is very cheap and rarely fails.
    const key = process.env.GEMINI_API_KEY || "";
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  /**
   * Reads all markdown files in the knowledge directory, parses them into 
   * semantic chunks (by heading/paragraph), and computes embeddings.
   */
  async initialize() {
    if (this.isInitialized) return;
    console.log("[RAG] Initializing Vector DB...");
    
    const kbPath = path.join(__dirname, "../../knowledge");
    if (!fs.existsSync(kbPath)) {
      console.warn("[RAG] Knowledge base directory not found.");
      return;
    }

    const files = fs.readdirSync(kbPath).filter(f => f.endsWith(".md"));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(kbPath, file), "utf-8");
      this.chunkMarkdown(file, content);
    }

    console.log(`[RAG] Created ${this.chunks.length} chunks. Generating embeddings...`);
    
    // Batch process embeddings to respect API limits
    const batchSize = 10;
    for (let i = 0; i < this.chunks.length; i += batchSize) {
      const batch = this.chunks.slice(i, i + batchSize);
      await Promise.all(batch.map(async (chunk) => {
        try {
          const result = await this.ai.models.embedContent({
            model: "text-embedding-004",
            contents: chunk.text,
          });
          chunk.embedding = result.embeddings?.[0]?.values;
        } catch (err) {
          console.error(`[RAG] Failed to embed chunk ${chunk.id}`, err);
        }
      }));
    }

    this.isInitialized = true;
    console.log("[RAG] Vector DB Initialization complete.");
  }

  /**
   * Splits markdown by Header 2 (##) to maintain semantic context per chunk.
   */
  private chunkMarkdown(filename: string, content: string) {
    const sections = content.split(/\n##\s+/);
    const titleMatch = sections[0].match(/^#\s+(.*)/);
    const category = titleMatch ? titleMatch[1] : filename.replace(".md", "");

    // Process the rest of the sections
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;

      const lines = section.split("\n");
      const heading = lines[0].trim();
      const body = lines.slice(1).join("\n").trim();

      if (!body) continue;

      // Construct a highly contextual chunk string for the embedding model
      const contextualText = `Category: ${category}\nTopic: ${heading}\nInformation: ${body}`;
      
      this.chunks.push({
        id: `${filename}-${i}`,
        sourceFile: filename,
        category,
        text: contextualText
      });
    }
  }

  /**
   * Calculates cosine similarity between two vectors.
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Embeds the query and searches the vector space for the most similar chunk.
   * @param query The user's question
   * @param threshold Minimum similarity score (e.g. 0.85) to return a direct result
   */
  async search(query: string, threshold = 0.85): Promise<Chunk | null> {
    if (!this.isInitialized || this.chunks.length === 0) return null;

    try {
      const queryEmbedResult = await this.ai.models.embedContent({
        model: "text-embedding-004",
        contents: query,
      });
      const queryVector = queryEmbedResult.embeddings?.[0]?.values;
      if (!queryVector) return null;

      let bestMatch: Chunk | null = null;
      let highestScore = -1;

      for (const chunk of this.chunks) {
        if (!chunk.embedding) continue;
        const score = this.cosineSimilarity(queryVector, chunk.embedding);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = chunk;
        }
      }

      if (highestScore >= threshold && bestMatch) {
        console.log(`[RAG] Cache Hit! Score: ${highestScore.toFixed(3)} | Topic: ${bestMatch.category}`);
        return bestMatch;
      }
      
      console.log(`[RAG] No match found above threshold. Highest was ${highestScore.toFixed(3)}`);
      return null;
    } catch (err) {
      console.error("[RAG] Search failed:", err);
      return null;
    }
  }
}

export const vectorDB = new VectorDB();
