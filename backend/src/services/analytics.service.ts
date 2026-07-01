import { getDB } from "../db";

// Simple LRU Cache implementation
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_SIZE = 1000; // Prevent infinite memory growth

export const invalidateAnalyticsCache = (userId?: string) => {
  if (userId) {
    // Invalidate specific user cache keys
    for (const key of cache.keys()) {
      if (key.includes(userId)) {
        cache.delete(key);
      }
    }
  } else {
    // Invalidate all global dashboard metrics
    for (const key of cache.keys()) {
      if (key.startsWith('dashboard:')) {
        cache.delete(key);
      }
    }
  }
};

const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    // strict LRU: move to end
    cache.delete(key);
    cache.set(key, cached);
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // clear expired immediately
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey); // Evict oldest
  }
  cache.set(key, { data, timestamp: Date.now() });
};

export const getCitizenAnalytics = async (userId: string) => {
  const cacheKey = `citizen:${userId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const db = await getDB();
  
  // Single pass aggregation for citizen stats
  const stats = await db.get(`
    SELECT 
      COUNT(*) as totalScans,
      SUM(co2) as totalCO2,
      SUM(estimatedPricePerKg * estimatedWeight) as estimatedEarnings,
      AVG(confidence) as averageConfidence,
      SUM(CASE WHEN category = 'Unknown' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as unknownPercentage
    FROM batches
    WHERE userId = ?
  `, userId);

  // Grouped aggregation for most recycled material
  const topMaterial = await db.get(`
    SELECT category, COUNT(*) as count
    FROM batches
    WHERE userId = ? AND category != 'Unknown'
    GROUP BY category
    ORDER BY count DESC
    LIMIT 1
  `, userId);

  // Weekly trend
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weeklyTrend = await db.all(`
    SELECT date(timestamp) as date, COUNT(*) as count, SUM(co2) as co2
    FROM batches
    WHERE userId = ? AND timestamp >= ?
    GROUP BY date(timestamp)
    ORDER BY date ASC
  `, [userId, since]);

  const result = {
    totalScans: stats?.totalScans || 0,
    totalCO2: stats?.totalCO2 || 0,
    estimatedEarnings: stats?.estimatedEarnings || 0,
    averageConfidence: stats?.averageConfidence || 0,
    unknownPercentage: stats?.unknownPercentage || 0,
    mostRecycledMaterial: topMaterial?.category || null,
    weeklyTrend
  };

  setCachedData(cacheKey, result);
  return result;
};

export const getRecyclerAnalytics = async (userId: string) => {
  const cacheKey = `recycler:${userId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const db = await getDB();

  // Recycler stats based on transactions or waste_listings
  const stats = await db.get(`
    SELECT 
      COUNT(*) as completedPickups,
      SUM(estimatedWeightKg) as totalWasteRecycledKg
    FROM waste_listings
    WHERE recyclerId = ? AND status = 'completed'
  `, userId);

  const result = {
    completedPickups: stats?.completedPickups || 0,
    totalWasteRecycledKg: stats?.totalWasteRecycledKg || 0
  };

  setCachedData(cacheKey, result);
  return result;
};

export const getMunicipalityAnalytics = async (ulbCode: string) => {
  // Mock logic for municipality (for future implementation)
  return { ulbCode, totalScans: 0 };
};

export const getDashboardMetrics = async () => {
  const cacheKey = `dashboard:global`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const db = await getDB();

  const stats = await db.get(`
    SELECT 
      COUNT(*) as totalPlatformScans,
      SUM(co2) as platformTotalCO2
    FROM batches
  `);

  const result = {
    totalPlatformScans: stats?.totalPlatformScans || 0,
    platformTotalCO2: stats?.platformTotalCO2 || 0
  };

  setCachedData(cacheKey, result);
  return result;
};

export const getAITelemetry = async () => {
  const cacheKey = `dashboard:telemetry`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const db = await getDB();

  // Basic stats
  const stats = await db.get(`
    SELECT 
      COUNT(*) as totalRequests,
      SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as successPercentage,
      SUM(CASE WHEN status = 'UNKNOWN' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as unknownPercentage,
      SUM(CASE WHEN status = 'TIMEOUT' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as timeoutPercentage,
      SUM(CASE WHEN validationFailed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as validationFailedPercentage,
      SUM(CASE WHEN normalizationCorrected = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as normalizationCorrectedPercentage,
      SUM(CASE WHEN retryCount > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as retryPercentage,
      AVG(latencyMs) as averageLatency
    FROM ai_telemetry
  `);

  if (!stats || stats.totalRequests === 0) {
    const emptyResult = {
      totalRequests: 0, successPercentage: 0, unknownPercentage: 0, timeoutPercentage: 0,
      validationFailedPercentage: 0, normalizationCorrectedPercentage: 0, retryPercentage: 0,
      averageLatency: 0, p95Latency: 0, mostScannedMaterial: null, mostFailedMaterial: null,
      topErrorCodes: [], modelUsage: []
    };
    setCachedData(cacheKey, emptyResult);
    return emptyResult;
  }

  // P95 Latency - approximate by fetching top 5% ordered latencies
  // Or in sqlite we can do LIMIT offset
  const offset = Math.floor(stats.totalRequests * 0.95);
  const p95Row = await db.get(`
    SELECT latencyMs 
    FROM ai_telemetry 
    ORDER BY latencyMs ASC 
    LIMIT 1 OFFSET ?
  `, offset);

  // Most scanned material
  const mostScanned = await db.get(`
    SELECT material, COUNT(*) as count 
    FROM ai_telemetry 
    WHERE material != 'Unknown' 
    GROUP BY material 
    ORDER BY count DESC LIMIT 1
  `);

  // Most failed material
  const mostFailed = await db.get(`
    SELECT material, COUNT(*) as count 
    FROM ai_telemetry 
    WHERE status != 'SUCCESS' AND material != 'Unknown' 
    GROUP BY material 
    ORDER BY count DESC LIMIT 1
  `);

  // Top Error Codes
  const topErrorCodes = await db.all(`
    SELECT errorCode, COUNT(*) as count
    FROM ai_telemetry
    WHERE errorCode != 'NONE'
    GROUP BY errorCode
    ORDER BY count DESC
  `);

  // Model Usage
  const modelUsage = await db.all(`
    SELECT model, COUNT(*) as count
    FROM ai_telemetry
    GROUP BY model
    ORDER BY count DESC
  `);

  const result = {
    totalRequests: stats.totalRequests,
    successPercentage: parseFloat(stats.successPercentage?.toFixed(2) || "0"),
    unknownPercentage: parseFloat(stats.unknownPercentage?.toFixed(2) || "0"),
    timeoutPercentage: parseFloat(stats.timeoutPercentage?.toFixed(2) || "0"),
    validationFailedPercentage: parseFloat(stats.validationFailedPercentage?.toFixed(2) || "0"),
    normalizationCorrectedPercentage: parseFloat(stats.normalizationCorrectedPercentage?.toFixed(2) || "0"),
    retryPercentage: parseFloat(stats.retryPercentage?.toFixed(2) || "0"),
    averageLatency: Math.round(stats.averageLatency || 0),
    p95Latency: p95Row?.latencyMs || 0,
    mostScannedMaterial: mostScanned?.material || null,
    mostFailedMaterial: mostFailed?.material || null,
    topErrorCodes,
    modelUsage
  };

  setCachedData(cacheKey, result);
  return result;
};
