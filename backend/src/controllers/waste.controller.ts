import { Request, Response, NextFunction } from "express";
import { analyzeImage } from "../services/ai.service";
import { getDB } from "../db";
import { v4 as uuidv4 } from "uuid";
import { saveBatch } from "../services/batch.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";
import { ValidationError, DatabaseError } from "../utils/errors";

/* ===============================
   SCAN WASTE
================================= */
export const scanWaste = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { image, lat, lng } = req.body;
    if (!image) {
      throw new ValidationError("Image is required");
    }

    if (image.length > 7000000) { // ~5MB base64 limit
      throw new ValidationError("Image is too large. Maximum allowed size is 5 MB.");
    }
    
    if (image.includes("image/svg") || !image.startsWith("data:image/")) {
      throw new ValidationError("Invalid image format. SVGs and executables are rejected.");
    }

    const db = await getDB();
    const result = await analyzeImage(image);

    const user = await db.get(
      "SELECT * FROM users WHERE id = ?",
      req.user.id
    );

    if (!user) {
      throw new ValidationError("User not found");
    }

    const newScans = (user.totalScans || 0) + 1;
    const newCO2 = (user.totalCO2 || 0) + result.co2;

    const today = new Date().toISOString().split("T")[0];
    const lastDate = user.lastScanDate
      ? user.lastScanDate.split("T")[0]
      : null;

    await db.run(
      `UPDATE users
       SET totalScans = ?, totalCO2 = ?, lastScanDate = ?
       WHERE id = ?`,
      [newScans, newCO2, today, req.user.id]
    );

    // ─── QUERY SCRAP PRICE ENGINE ─────────────────────────────────────────────
    const priceRecord = await db.get(
      "SELECT pricePerKg FROM scrap_prices WHERE material = ? LIMIT 1",
      result.category
    );
    const estimatedPricePerKg = priceRecord ? priceRecord.pricePerKg : null;

    // Isolate DB write to service
    await saveBatch(
      req.user.id,
      result,
      req.body.thumbnail || null,
      lat || null,
      lng || null,
      estimatedPricePerKg
    );

    sendSuccess(res, {
      ...result,
      estimatedPricePerKg,
    });
  } catch (err: any) {
    if (err?.message?.includes("UNAVAILABLE") || err?.message?.includes("TIMEOUT")) {
      next(new DatabaseError("AI scanner is temporarily unavailable or timed out. Please try again in a moment."));
    } else {
      next(err);
    }
  }
};

/* ===============================
   HISTORY
================================= */
/* ===============================
   HISTORY
================================= */
export const getHistory = async (req: any, res: Response, next: NextFunction) => {
  try {
    const db = await getDB();

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Extract query params for Smart History
    const { search, material, startDate, endDate, minConfidence, recyclability, sort } = req.query;
    
    let whereClause = "WHERE b.userId = ?";
    const queryParams: any[] = [req.user.id];

    if (search) {
      whereClause += " AND (b.category LIKE ? OR b.subCategory LIKE ?)";
      const searchStr = `%${search}%`;
      queryParams.push(searchStr, searchStr);
    }
    
    if (material) {
      whereClause += " AND b.category = ?";
      queryParams.push(material);
    }
    
    if (startDate) {
      whereClause += " AND b.timestamp >= ?";
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += " AND b.timestamp <= ?";
      queryParams.push(endDate);
    }
    
    if (minConfidence) {
      whereClause += " AND b.confidence >= ?";
      queryParams.push(parseFloat(minConfidence as string));
    }
    
    if (recyclability) {
      whereClause += " AND b.recyclability = ?";
      queryParams.push(recyclability);
    }
    
    let orderByClause = "ORDER BY b.timestamp DESC";
    switch(sort) {
      case 'oldest': orderByClause = "ORDER BY b.timestamp ASC"; break;
      case 'highest_value': orderByClause = "ORDER BY b.estimatedPricePerKg DESC, b.timestamp DESC"; break;
      case 'highest_co2': orderByClause = "ORDER BY b.co2 DESC, b.timestamp DESC"; break;
      case 'highest_confidence': orderByClause = "ORDER BY b.confidence DESC, b.timestamp DESC"; break;
      case 'newest':
      default:
        orderByClause = "ORDER BY b.timestamp DESC"; break;
    }

    const history = await db.all(
      `SELECT b.id, b.category, b.subCategory, b.confidence, b.co2, b.timestamp, b.thumbnail, 
              b.estimatedPricePerKg, b.estimatedWeight, b.marketDemand, b.aiVersion, 
              b.validationStatus, b.normalizationStatus, b.recyclability
       FROM batches b
       ${whereClause}
       ${orderByClause}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const countResult = await db.get(`SELECT COUNT(*) as total FROM batches b ${whereClause}`, queryParams);
    
    // Remove the user query for totalScans/totalCO2 here as that belongs in the Analytics Service now!
    // But we might still need to return them if frontend depends on it immediately, but frontend has a dashboard for that.
    // I will return total count for pagination.
    
    sendSuccess(res, {
      history,
      totalCount: countResult?.total || 0
    });
  } catch (err) {
    next(new DatabaseError("History fetch failed"));
  }
};



/* ===============================
   WEEKLY STATS
================================= */
export const getStats = async (req: any, res: Response) => {
  try {
    const db = await getDB();

    const since = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const weekly = await db.all(
      `SELECT category,
              COUNT(*) as count,
              SUM(co2) as totalCO2
       FROM batches
       WHERE userId = ?
       AND timestamp >= ?
       GROUP BY category`,
      [req.user.id, since]
    );

    res.json(weekly);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Stats fetch failed" });
  }
};

/* ===============================
   HOTSPOTS MAP
================================= */
export const getHotspots = async (_req: any, res: Response) => {
  try {
    const db = await getDB();
    const hotspots = await db.all(`
      SELECT id, category, lat, lng, timestamp, co2
      FROM batches 
      WHERE lat IS NOT NULL AND lng IS NOT NULL
      ORDER BY timestamp DESC
    `);
    res.json(hotspots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hotspot fetch failed" });
  }
};
