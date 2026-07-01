import crypto from "crypto";
import { executeWithModelRouter } from "../utils/ai-router.util";
import { ApiError } from "../utils/errors";
import { logAITelemetry } from "./telemetry.service";
import { TelemetryStatus, TelemetryErrorCode } from "../types/telemetry.types";

type ScanResult = {
  category: string;
  confidence: number;
  co2: number;
  imageHash: string;
  alternatives?: { category: string; confidence: number }[];
  lowConfidence?: boolean;
};

const CO2_PER_CATEGORY: Record<string, number> = {
  Plastic:  2.5,
  Paper:    1.2,
  Metal:    3.8,
  Glass:    2.1,
  Organic:  0.9,
  Other:    1.0,
};

import { normalizeAndValidateAIResponse } from "./ai.validator";
import { AIResponse } from "../types/ai.types";

export const analyzeImage = async (imageBase64: string): Promise<AIResponse> => {
  const hash = crypto.createHash("sha256").update(imageBase64).digest("hex");

  let mimeType = "image/jpeg";
  let base64Data = imageBase64;

  if (imageBase64.startsWith("data:")) {
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }
  }

  const prompt = `You are a strict waste classification AI for India's IWIS (Integrated Waste Intelligence System).
Analyze this image and classify the waste material.

Return ONLY a valid JSON object (no markdown, no backticks, no explanation) with this exact structure:
{
  "category": "Metal",
  "subCategory": "Aluminum Can",
  "confidence": 92,
  "co2": 3.8,
  "estimatedWeightKg": 0.05,
  "marketDemand": "High",
  "recyclability": "Infinitely recyclable",
  "disposalAdvice": "Crush before disposing to save space.",
  "recyclingInstructions": "Empty liquids and rinse before recycling.",
  "safetyWarnings": "Edges may be sharp if crushed.",
  "interestingFact": "Recycling one aluminum can saves enough energy to run a TV for 3 hours.",
  "example": "Soda can"
}

Rules:
1. "category" MUST be exactly one of: Plastic, Paper, Metal, Glass, Organic, E-Waste, Other, or Unknown.
2. "confidence" is an integer 0-100.
3. If the image is blurry, ambiguous, or not clearly waste, YOU MUST return "category": "Unknown" and confidence < 70. Never guess.
4. "marketDemand" MUST be exactly one of: High, Medium, Low, None.
5. Keep text fields concise (1-2 sentences max).`;

  const fetchFromAI = async (timeoutMs: number): Promise<string> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        const err: any = new Error("TIMEOUT");
        err.status = 504;
        reject(err);
      }, timeoutMs)
    );

    const geminiPromise = executeWithModelRouter(
      (ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: [
            prompt,
            { inlineData: { data: base64Data, mimeType } },
          ],
          config: { responseMimeType: "application/json" },
        }),
      "gemini-2.5-flash",
      ["gemini-1.5-flash"]
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    return (response as any).text || "{}";
  };

  let text = "";
  let timeoutOccurred = false;
  let jsonParseFailed = false;
  let retryCount = 0;
  let networkError = false;
  const startTime = Date.now();
  const aiVersion = "gemini-2.5-flash"; // from executeWithModelRouter primary

  try {
    text = await fetchFromAI(4000); // 4s soft timeout
  } catch (err: any) {
    retryCount++;
    try {
      // 1-Time Retry with another 4s timeout (8s max total)
      text = await fetchFromAI(4000); 
    } catch (retryErr: any) {
      if (retryErr?.message === "TIMEOUT") {
        timeoutOccurred = true;
      } else {
        networkError = true;
      }
    }
  }

  let parsed;
  if (!timeoutOccurred && !networkError) {
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      jsonParseFailed = true;
    }
  }

  if (timeoutOccurred || jsonParseFailed || networkError) {
    parsed = { 
      category: "Unknown", 
      confidence: 0,
      disposalAdvice: "We're having trouble analyzing this image right now. Please try another photo or try again in a moment." 
    };
  }

  const validated = normalizeAndValidateAIResponse(parsed);
  const processingTimeMs = Date.now() - startTime;
  
  let errorCode = TelemetryErrorCode.NONE;
  let status = TelemetryStatus.SUCCESS;

  if (timeoutOccurred) {
    errorCode = TelemetryErrorCode.TIMEOUT;
    status = TelemetryStatus.TIMEOUT;
  } else if (networkError) {
    errorCode = TelemetryErrorCode.NETWORK;
    status = TelemetryStatus.NETWORK_ERROR;
  } else if (jsonParseFailed) {
    errorCode = TelemetryErrorCode.JSON_PARSE;
    status = TelemetryStatus.MODEL_ERROR;
  } else if (validated.validationFailed) {
    errorCode = TelemetryErrorCode.INVALID_SCHEMA;
    status = TelemetryStatus.VALIDATION_FAILED;
  } else if (validated.category === "Unknown") {
    status = TelemetryStatus.UNKNOWN;
  }

  logAITelemetry({
    aiVersion,
    model: aiVersion,
    latencyMs: processingTimeMs,
    status,
    retryCount,
    validationFailed: !!validated.validationFailed,
    normalizationCorrected: !!validated.normalizationCorrected,
    material: validated.category,
    confidence: validated.confidence,
    errorCode,
  });
  
  validated.imageHash = hash;
  validated.aiVersion = timeoutOccurred || networkError ? "fallback-error" : aiVersion;
  validated.processingTimeMs = processingTimeMs;
  
  return validated;
};
