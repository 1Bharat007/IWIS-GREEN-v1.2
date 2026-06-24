import crypto from "crypto";
import { executeWithModelRouter } from "../utils/ai-router.util";
import { ApiError } from "../utils/errors";

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

export const analyzeImage = async (imageBase64: string): Promise<ScanResult> => {
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

  const prompt = `You are a waste classification AI for India's IWIS (Integrated Waste Intelligence System).

Analyze this image and classify the waste material.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "primary": { "category": "Metal", "confidence": 92 },
  "alternatives": [
    { "category": "Plastic", "confidence": 45 },
    { "category": "Other", "confidence": 12 }
  ],
  "co2": 3.8
}

Rules:
- "category" must be one of: Plastic, Paper, Metal, Glass, Organic, Other
- "confidence" is an integer 0-100 representing your certainty
- "co2" is the estimated kg of CO₂ avoided if properly recycled (e.g., Metal = 3.8)
- "alternatives" lists up to 2 other plausible categories with their confidence scores
- If the image is blurry, ambiguous, or not clearly waste, set confidence below 60
- Never guess with false certainty — lower confidence is more trustworthy than wrong certainty`;

  // 15-second timeout per attempt to allow fast cascading fallbacks
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => {
      const err: any = new Error("TIMEOUT");
      err.status = 504; // Marks error as retryable for the router
      reject(err);
    }, 15000)
  );

  const geminiPromise = executeWithModelRouter(
    (ai, modelName) =>
      ai.models.generateContent({
        model: modelName,
        contents: [
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      }),
    "gemini-3.1-flash-lite", // Primary fast model for vision
    ["gemini-3.1-flash-image", "gemini-2.5-flash"] // Fallbacks
  );

  const response = await Promise.race([geminiPromise, timeoutPromise]);
  const text = (response as any).text || "{}";
  
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error("Failed to parse JSON response from AI");
  }

  const category: string = parsed?.primary?.category || "Other";
  const confidence: number =
    typeof parsed?.primary?.confidence === "number"
      ? parsed.primary.confidence
      : 0;
  const co2: number =
    typeof parsed?.co2 === "number"
      ? parsed.co2
      : CO2_PER_CATEGORY[category] ?? 1.0;

  return {
    category,
    confidence,
    co2: parseFloat(co2.toFixed(2)),
    imageHash: hash,
    alternatives: parsed?.alternatives ?? [],
    lowConfidence: confidence < 75,
  };
};
