import { v4 as uuidv4 } from "uuid";
import { getDB } from "../db";
import { AITelemetryEvent } from "../types/telemetry.types";

/**
 * Asynchronously inserts an AI telemetry event.
 * Never throws, so it never interrupts the main request thread.
 */
export const logAITelemetry = (event: AITelemetryEvent) => {
  setImmediate(async () => {
    try {
      const db = await getDB();
      const id = uuidv4();
      const timestamp = new Date().toISOString();
      
      await db.run(
        `INSERT INTO ai_telemetry (
          id, timestamp, userId, aiVersion, model, latencyMs, status, 
          retryCount, validationFailed, normalizationCorrected, material, confidence, errorCode
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )`,
        [
          id,
          timestamp,
          event.userId || null,
          event.aiVersion,
          event.model,
          event.latencyMs,
          event.status,
          event.retryCount,
          event.validationFailed ? 1 : 0,
          event.normalizationCorrected ? 1 : 0,
          event.material,
          event.confidence,
          event.errorCode
        ]
      );
    } catch (err) {
      console.error("[Telemetry] Failed to log AI telemetry:", err);
      // Suppress failure, do not block scanning
    }
  });
};

/**
 * Cleanup telemetry older than 30 days to prevent infinite growth.
 */
export const cleanupOldTelemetry = async () => {
  try {
    const db = await getDB();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = await db.run(`DELETE FROM ai_telemetry WHERE timestamp < ?`, thirtyDaysAgo);
    
    // Invalidate analytics cache globally since we removed rows
    const { invalidateAnalyticsCache } = require("./analytics.service");
    invalidateAnalyticsCache();
    
    console.log(`[Telemetry] Cleanup complete. Removed old telemetry records.`);
  } catch (err) {
    console.error("[Telemetry] Cleanup failed:", err);
  }
};

// Schedule automated cleanup every 24 hours
setInterval(cleanupOldTelemetry, 24 * 60 * 60 * 1000);
