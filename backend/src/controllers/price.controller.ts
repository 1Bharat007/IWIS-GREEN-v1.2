import { Request, Response } from "express";
import { getDB } from "../db";

const VALID_MATERIALS = [
  "Plastic",
  "Cardboard",
  "Paper",
  "E-Waste",
  "Glass",
  "Metal",
  "Organic",
  "Mixed"
];

// ─── GET CURRENT PRICES ───────────────────────────────────────────────────────
export const getPrices = async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    const db = await getDB();
    
    let prices;
    if (city) {
      prices = await db.all(
        "SELECT * FROM scrap_prices WHERE city = ? ORDER BY material ASC",
        city
      );
    } else {
      prices = await db.all("SELECT * FROM scrap_prices ORDER BY city ASC, material ASC");
    }
    
    res.json(prices);
  } catch (err) {
    console.error("[getPrices] error:", err);
    res.status(500).json({ message: "Failed to fetch prices." });
  }
};

// ─── UPDATE PRICE (ADMIN ONLY) ───────────────────────────────────────────────
export const updatePrice = async (req: any, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;
    const { pricePerKg, source, effectiveDate } = req.body;
    
    if (pricePerKg === undefined || pricePerKg < 0) {
      return res.status(400).json({ message: "Invalid or missing pricePerKg." });
    }

    const db = await getDB();
    const existing = await db.get("SELECT * FROM scrap_prices WHERE id = ?", id);
    if (!existing) {
      return res.status(404).json({ message: "Price record not found." });
    }

    const now = new Date().toISOString();
    const effective = effectiveDate || now;
    const priceSource = source || "manual";

    await db.run(
      `UPDATE scrap_prices 
       SET pricePerKg = ?, source = ?, effectiveDate = ?, updatedAt = ? 
       WHERE id = ?`,
      [pricePerKg, priceSource, effective, now, id]
    );

    const updated = await db.get("SELECT * FROM scrap_prices WHERE id = ?", id);
    res.json(updated);
  } catch (err) {
    console.error("[updatePrice] error:", err);
    res.status(500).json({ message: "Failed to update price." });
  }
};
