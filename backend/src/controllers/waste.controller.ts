import { Request, Response } from "express";
import { analyzeImage } from "../services/ai.service";
import { getDB } from "../db";
import { v4 as uuidv4 } from "uuid";
import { getTier } from "../services/tier.service";

/* ===============================
   SCAN WASTE
================================= */
export const scanWaste = async (req: any, res: Response) => {
  try {
    const { image } = req.body;
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

    let newStreak = user.streak || 0;

    if (lastDate === today) {
      // no change
    } else {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      if (lastDate === yesterday) {
        newStreak++;
      } else {
        newStreak = 1;
      }
    }

    const newTier = getTier(newScans);

    await db.run(
      `UPDATE users
       SET totalScans = ?, totalCO2 = ?, streak = ?, lastScanDate = ?, tier = ?
       WHERE id = ?`,
      [newScans, newCO2, newStreak, today, newTier, req.user.id]
    );

    await db.run(
      `INSERT INTO batches
       (id, userId, category, confidence, co2, timestamp, imageHash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        req.user.id,
        result.category,
        result.confidence,
        result.co2,
        new Date().toISOString(),
        result.imageHash,
      ]
    );

    const tips: Record<string, string> = {
      Plastic: "Rinse plastic before recycling to increase reuse quality.",
      Paper: "Avoid glossy or laminated paper when recycling.",
      Metal: "Aluminum can be recycled infinitely.",
      Glass: "Separate by color for better recycling.",
      Organic: "Compost organic waste to reduce methane emissions.",
    };

    res.json({
      ...result,
      tier: newTier,
      streak: newStreak,
      smartTip: tips[result.category] || "Dispose responsibly.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Scan failed" });
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

    const history = await db.all(
      `SELECT id, category, confidence, co2, timestamp
       FROM batches
       WHERE userId = ?
       ORDER BY timestamp DESC`,
      req.user.id
    );

    const user = await db.get(
      `SELECT totalScans, totalCO2, streak, tier
       FROM users
       WHERE id = ?`,
      req.user.id
    );

    res.json({
      history,
      totalScans: user?.totalScans || 0,
      totalCO2: user?.totalCO2 || 0,
      streak: user?.streak || 0,
      tier: user?.tier || "Getting Started",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "History fetch failed" });
  }
};



/* ===============================
   LEADERBOARD
================================= */
export const getLeaderboard = async (_req: any, res: Response) => {
  try {
    const db = await getDB();

    const leaders = await db.all(
      `SELECT email, totalCO2, totalScans, tier
       FROM users
       ORDER BY totalCO2 DESC
       LIMIT 20`
    );

    res.json(leaders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Leaderboard fetch failed" });
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
