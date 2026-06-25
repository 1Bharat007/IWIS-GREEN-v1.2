import { GoogleGenAI } from "@google/genai";

let currentKeyIndex = 0;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Executes a Gemini AI request with intelligent model routing and automatic failover.
 * 
 * Retry Strategy:
 * 1. Attempt Primary Model
 * 2. If fail -> wait 2s -> Attempt Primary Model again
 * 3. If fail -> wait 5s -> Attempt Primary Model again
 * 4. If fail -> Fallback Model 1
 * 5. If fail -> Fallback Model 2
 * 6. If all models on current API key fail -> Rotate to next API key and repeat from step 1
 */
export const executeWithModelRouter = async <T>(
  buildRequest: (ai: GoogleGenAI, modelName: string) => Promise<T>,
  primaryModel: string,
  fallbackModels: string[] = []
): Promise<T> => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY configured.");
  }

  let lastError;
  const startIndex = currentKeyIndex;

  // Loop through available API keys
  for (let keyAttempt = 0; keyAttempt < keys.length; keyAttempt++) {
    const keyToTry = keys[(startIndex + keyAttempt) % keys.length];
    const ai = new GoogleGenAI({ apiKey: keyToTry });

    const modelsToTry = [primaryModel, ...fallbackModels];

    // Loop through the primary model + fallback chain
    for (let modelIdx = 0; modelIdx < modelsToTry.length; modelIdx++) {
      const targetModel = modelsToTry[modelIdx];

      // Retry mechanism per model (Attempt 1, Wait 1s, Attempt 2)
      const retries = [0, 1000]; 

      for (let retryAttempt = 0; retryAttempt < retries.length; retryAttempt++) {
        if (retries[retryAttempt] > 0) {
          await delay(retries[retryAttempt]);
        }

        try {
          // Execute the request with the specific model
          const result = await buildRequest(ai, targetModel);
          
          if (keyAttempt > 0) {
            console.log(`[Gemini Router] Switched to backup key ending in ...${keyToTry.slice(-4)}`);
          }
          if (modelIdx > 0) {
            console.log(`[Gemini Router] Primary model failed. Cascaded to fallback model: ${targetModel}`);
          }
          
          // Persist the working key index globally
          currentKeyIndex = (startIndex + keyAttempt) % keys.length;
          
          return result;
        } catch (error: any) {
          lastError = error;
          
          const status = error?.status;
          const msg = error?.message || String(error);
          
          // Determine if we should retry this specific model
          const isRetryable = status === 429 || status === 503 || status === 500 || msg.includes("TIMEOUT");

          if (!isRetryable) {
             // For structural errors (e.g., 400 Bad Request, 404 Not Found, auth failures), don't retry the same model
             console.warn(`[Gemini Router] Non-retryable error (${status}) on model ${targetModel}:`, msg);
             break; // break out of retry loop, move to next model/key
          }

          console.warn(
            `[Gemini Router] Attempt ${retryAttempt + 1} failed for model ${targetModel} on key ...${keyToTry.slice(-4)}. Reason:`,
            msg
          );
        }
      } // End retries for a single model
    } // End model chain loop
  } // End API key loop

  if (lastError) {
    console.error("========================");
    console.error("[GEMINI ROUTER EXHAUSTED ALL FALLBACKS]");
    console.error("Final Error Message:", lastError?.message);
    console.error("Final Error Object:", JSON.stringify(lastError, null, 2));
    console.error("========================");
  }

  throw lastError;
};
