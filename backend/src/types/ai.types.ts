export type WasteCategory = "Plastic" | "Paper" | "Metal" | "Glass" | "Organic" | "E-Waste" | "Other" | "Unknown";

export type MarketDemand = "High" | "Medium" | "Low" | "None";

export interface AIResponse {
  category: WasteCategory;
  subCategory: string;
  confidence: number;
  co2: number;
  estimatedWeightKg?: number;
  marketDemand: MarketDemand;
  recyclability: string;
  disposalAdvice: string;
  recyclingInstructions: string;
  safetyWarnings: string;
  interestingFact: string;
  example: string;
  lowConfidence: boolean;
  imageHash?: string;
  aiVersion?: string;
  processingTimeMs?: number;
  validationFailed?: boolean;
  normalizationCorrected?: boolean;
  errorCode?: string;
}
