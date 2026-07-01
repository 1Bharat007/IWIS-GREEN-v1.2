import { v4 as uuidv4 } from "uuid";
import { getDB } from "../db";
import { AIResponse } from "../types/ai.types";
import { invalidateAnalyticsCache } from "./analytics.service";

export const saveBatch = async (
  userId: string,
  result: AIResponse,
  thumbnailBase64: string | null,
  lat: number | null,
  lng: number | null,
  estimatedPricePerKg: number | null
) => {
  const db = await getDB();
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  // Create JSON for narrative metadata
  const narrativeMetadata = JSON.stringify({
    disposalAdvice: result.disposalAdvice,
    recyclingInstructions: result.recyclingInstructions,
    interestingFact: result.interestingFact,
    safetyWarnings: result.safetyWarnings,
    example: result.example
  });

  await db.run(
    `INSERT INTO batches (
      id, userId, category, confidence, co2, timestamp, imageHash, thumbnail, lat, lng,
      subCategory, recyclability, marketDemand, estimatedWeight, estimatedPricePerKg,
      aiVersion, processingTimeMs, validationStatus, normalizationStatus, narrativeMetadata
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
      ?, ?, ?, ?, ?, 
      ?, ?, ?, ?, ?
    )`,
    [
      id,
      userId,
      result.category,
      result.confidence,
      result.co2,
      timestamp,
      result.imageHash || null,
      thumbnailBase64,
      lat,
      lng,
      result.subCategory,
      result.recyclability,
      result.marketDemand,
      result.estimatedWeightKg || null,
      estimatedPricePerKg,
      result.aiVersion || 'unknown',
      result.processingTimeMs || 0,
      'valid', // Validation is handled gracefully before saving
      'normalized',
      narrativeMetadata
    ]
  );

  invalidateAnalyticsCache(userId);
  invalidateAnalyticsCache(); // global

  return id;
};
