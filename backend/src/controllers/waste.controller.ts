import { Request, Response } from "express";
import { analyzeImage } from "../services/ai.service";
import { getDB } from "../db";
import { v4 as uuidv4 } from "uuid";
/* ===============================
   SCAN WASTE
================================= */
export const scanWaste = async (req: any, res: Response) => {
  try {
    const { image, lat, lng } = req.body;
    if (!image) {
      return res.status(400).json({ message: "Image required" });
    }

    const db = await getDB();
    const result = await analyzeImage(image);

    const user = await db.get(
      "SELECT * FROM users WHERE id = ?",
      req.user.id
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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

    await db.run(
      `INSERT INTO batches
       (id, userId, category, confidence, co2, timestamp, imageHash, thumbnail, lat, lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        req.user.id,
        result.category,
        result.confidence,
        result.co2,
        new Date().toISOString(),
        result.imageHash,
        req.body.thumbnail || null,
        lat || null,
        lng || null
      ]
    );

    const tips: Record<string, string> = {
      Plastic: "Rinse plastic before recycling to increase reuse quality.",
      Paper: "Avoid glossy or laminated paper when recycling.",
      Metal: "Aluminum can be recycled infinitely.",
      Glass: "Separate by color for better recycling.",
      Organic: "Compost organic waste to reduce methane emissions.",
    };

    // ─── QUERY SCRAP PRICE ENGINE ─────────────────────────────────────────────
    const priceRecord = await db.get(
      "SELECT pricePerKg FROM scrap_prices WHERE material = ? LIMIT 1",
      result.category
    );
    const estimatedPricePerKg = priceRecord ? priceRecord.pricePerKg : null;

    res.json({
      ...result,
      smartTip: tips[result.category] || "Dispose responsibly.",
      alternatives: result.alternatives ?? [],
      lowConfidence: result.lowConfidence ?? false,
      estimatedPricePerKg,
    });
  } catch (err: any) {
    console.error("[scanWaste] error:", err?.message || err);
    const userMsg = err?.message?.includes("UNAVAILABLE")
      ? "AI scanner is temporarily unavailable due to high demand. Please try again in 30 seconds."
      : err?.message?.includes("TIMEOUT")
      ? "Scan timed out. Please try again."
      : "Scan failed. Please try again.";
    res.status(500).json({ error: userMsg });
  }
};

/* ===============================
   HISTORY
================================= */
/* ===============================
   HISTORY
================================= */
export const getHistory = async (req: any, res: Response) => {
  try {
    const db = await getDB();

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await db.all(
      `SELECT b.id, b.category, b.confidence, b.co2, b.timestamp, b.thumbnail, s.pricePerKg as estimatedPricePerKg
       FROM batches b
       LEFT JOIN scrap_prices s ON b.category = s.material
       WHERE b.userId = ?
       ORDER BY b.timestamp DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    const user = await db.get(
      `SELECT totalScans, totalCO2, streak, tier, greenPoints
       FROM users
       WHERE id = ?`,
      req.user.id
    );

    res.json({
      history,
      totalScans: user?.totalScans || 0,
      totalCO2: user?.totalCO2 || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "History fetch failed" });
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
