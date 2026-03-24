import { GoogleGenAI } from "@google/genai";

let currentKeyIndex = 0;

export const executeWithGeminiFallback = async <T>(
  operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY configured.");
  }

  let lastError;
  const startIndex = currentKeyIndex;

  for (let i = 0; i < keys.length; i++) {
    const keyToTry = keys[(startIndex + i) % keys.length];
    const ai = new GoogleGenAI({ apiKey: keyToTry });

    try {
      const result = await operation(ai);
      
      if (i > 0) {
        console.log(`[Gemini] Switched successfully to backup key ending in ...${keyToTry.slice(-4)}`);
      }
      
      // Update global index to the key that currently works
      currentKeyIndex = (startIndex + i) % keys.length;
      return result;
    } catch (error: any) {
      console.warn(
        `[Gemini] Request failed with key ending in ...${keyToTry.slice(-4)}. Reason:`,
        error.message || error
      );
      lastError = error;
      // Continue to the next key in the loop
    }
  }

  throw lastError; // Throw if all available keys have been exhausted and failed
};
