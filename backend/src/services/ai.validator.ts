import { AIResponse, WasteCategory, MarketDemand } from "../types/ai.types";

const VALID_CATEGORIES = new Set([
  "Plastic", "Paper", "Metal", "Glass", "Organic", "E-Waste", "Other", "Unknown"
]);

const VALID_DEMAND = new Set([
  "High", "Medium", "Low", "None"
]);

const CO2_HEURISTICS: Record<string, number> = {
  Plastic: 2.5,
  Paper: 1.2,
  Metal: 3.8,
  Glass: 2.1,
  Organic: 0.9,
  "E-Waste": 4.5,
  Other: 1.0,
  Unknown: 0.0,
};

export const normalizeAndValidateAIResponse = (raw: any): AIResponse => {
  let validationFailed = false;
  let normalizationCorrected = false;

  if (!raw || typeof raw !== "object") {
    validationFailed = true;
    raw = {};
  }

  // 1. Validate & Clamp Confidence
  let confidence = typeof raw?.confidence === "number" ? Math.floor(raw.confidence) : 0;
  if (typeof raw?.confidence !== "number") validationFailed = true;
  
  if (confidence < 0 || confidence > 100) {
    normalizationCorrected = true;
    confidence = Math.max(0, Math.min(100, confidence));
  }

  // 2. Validate Enums
  let category: WasteCategory = "Other";
  if (typeof raw?.category === "string" && VALID_CATEGORIES.has(raw.category)) {
    category = raw.category as WasteCategory;
  } else {
    validationFailed = true;
  }

  let marketDemand: MarketDemand = "None";
  if (typeof raw?.marketDemand === "string" && VALID_DEMAND.has(raw.marketDemand)) {
    marketDemand = raw.marketDemand as MarketDemand;
  } else {
    if (raw?.marketDemand) normalizationCorrected = true;
  }

  // 3. Fallback for Unknown / Low Confidence
  if (confidence < 70 || category === "Unknown") {
    if (category !== "Unknown" || confidence >= 70) normalizationCorrected = true;
    
    return {
      category: "Unknown",
      subCategory: "Unidentified Object",
      confidence,
      co2: 0,
      estimatedWeightKg: 0,
      marketDemand: "None",
      recyclability: "N/A",
      disposalAdvice: "I am not confident enough to classify this object. Please capture the entire object or improve lighting.",
      recyclingInstructions: "N/A",
      safetyWarnings: "Handle with care until identified.",
      interestingFact: "AI models need clear, well-lit photos to accurately classify materials.",
      example: "N/A",
      lowConfidence: true,
      validationFailed,
      normalizationCorrected,
    };
  }

  // 4. Validate Ranges & Coercion
  let co2 = typeof raw?.co2 === "number" ? parseFloat(raw.co2.toFixed(2)) : undefined;
  if (co2 === undefined) {
    validationFailed = true;
    co2 = CO2_HEURISTICS[category] || 1.0;
  }
  if (co2 < 0 || co2 > 20) {
    normalizationCorrected = true;
    if (co2 < 0) co2 = 0;
    if (co2 > 20) co2 = 20; // Sanity clamp
  }

  let estimatedWeightKg = typeof raw?.estimatedWeightKg === "number" ? parseFloat(raw.estimatedWeightKg.toFixed(2)) : undefined;
  if (estimatedWeightKg && (estimatedWeightKg < 0 || estimatedWeightKg > 100)) {
    normalizationCorrected = true;
    estimatedWeightKg = undefined;
  }

  // 5. Missing Field Recovery (String normalization)
  const safeString = (val: any, fallback: string) => {
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
    validationFailed = true;
    return fallback;
  };

  return {
    category,
    subCategory: safeString(raw?.subCategory, category),
    confidence,
    co2,
    estimatedWeightKg,
    marketDemand,
    recyclability: safeString(raw?.recyclability, "Standard recycling protocols apply."),
    disposalAdvice: safeString(raw?.disposalAdvice, "Dispose of in the appropriate recycling bin."),
    recyclingInstructions: safeString(raw?.recyclingInstructions, "Clean and dry before recycling."),
    safetyWarnings: safeString(raw?.safetyWarnings, "No specific safety warnings."),
    interestingFact: safeString(raw?.interestingFact, "Recycling saves energy and reduces landfill waste."),
    example: safeString(raw?.example, category),
    lowConfidence: false,
    validationFailed,
    normalizationCorrected,
  };
};
