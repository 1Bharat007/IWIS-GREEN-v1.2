import { Router } from "express";
import { getDB } from "../db";

const router = Router();

router.get("/leaderboard", async (req, res) => {
  const db = await getDB();

  const users = await db.all(
    `SELECT email, totalCO2, totalScans, tier
     FROM users
     ORDER BY totalCO2 DESC
     LIMIT 10`
  );

  res.json(users);
});

export default router;
