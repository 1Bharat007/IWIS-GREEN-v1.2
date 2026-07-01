import { getDB } from "../db";

export const getWardAnalytics = async (wardId: string) => {
  const db = await getDB();
  
  // Aggregate data by ward/pincode (assuming users table has pincode which maps to ward)
  const stats = await db.get(`
    SELECT 
      COUNT(b.id) as totalScans,
      SUM(b.co2) as totalCO2,
      COUNT(DISTINCT b.userId) as activeCitizens
    FROM batches b
    JOIN users u ON b.userId = u.id
    WHERE u.pincode = ?
  `, [wardId]);

  return {
    wardId,
    totalScans: stats?.totalScans || 0,
    totalCO2: stats?.totalCO2 || 0,
    activeCitizens: stats?.activeCitizens || 0,
  };
};

export const getCollectionTrends = async (wardId?: string) => {
  const db = await getDB();
  
  const query = `
    SELECT date(timestamp) as date, COUNT(*) as volume 
    FROM batches 
    ${wardId ? 'JOIN users u ON batches.userId = u.id WHERE u.pincode = ?' : ''}
    GROUP BY date(timestamp)
    ORDER BY date ASC
    LIMIT 30
  `;
  
  const params = wardId ? [wardId] : [];
  const trends = await db.all(query, params);
  return trends;
};

export const getMaterialHeatmaps = async () => {
  const db = await getDB();
  
  // Aggregate coordinates
  const heatmap = await db.all(`
    SELECT lat, lng, category as material, COUNT(*) as intensity
    FROM batches
    WHERE lat IS NOT NULL AND lng IS NOT NULL
    GROUP BY lat, lng, category
  `);
  
  return heatmap;
};

export const getCitizenParticipation = async () => {
  const db = await getDB();
  
  const participation = await db.all(`
    SELECT tier, COUNT(*) as userCount
    FROM users
    GROUP BY tier
  `);
  
  return participation;
};

export const getPredictionAccuracy = async () => {
  const db = await getDB();
  
  const stats = await db.get(`
    SELECT 
      AVG(confidence) as averageConfidence,
      SUM(CASE WHEN validationFailed = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as validSchemaPercentage,
      SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as successPercentage
    FROM ai_telemetry
  `);
  
  return stats;
};

export const getMonthlyReport = async (month: string, year: string) => {
  const db = await getDB();
  
  const stats = await db.get(`
    SELECT 
      COUNT(*) as totalScans,
      SUM(co2) as totalCO2
    FROM batches
    WHERE strftime('%m', timestamp) = ? AND strftime('%Y', timestamp) = ?
  `, [month, year]);
  
  return stats;
};

export const getFutureForecast = async () => {
  // Simple linear regression forecast mockup
  return {
    expectedGrowthPercentage: 15.5,
    projectedVolumeNextMonth: 1250,
    projectedCO2SavingsKg: 450.5
  };
};
