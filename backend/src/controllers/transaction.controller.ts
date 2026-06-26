import { Request, Response } from "express";
import { getDB } from "../db";

export const getMyTransactions = async (req: any, res: Response) => {
  try {
    const db = await getDB();
    const transactions = await db.all(
      `SELECT t.*, 
              c.displayName as citizenName, 
              r.businessName as recyclerBusinessName
       FROM transactions t
       LEFT JOIN users c ON t.citizenId = c.id
       LEFT JOIN recycler_profiles r ON t.recyclerId = r.userId
       WHERE t.citizenId = ? OR t.recyclerId = ?
       ORDER BY t.createdAt DESC`,
      [req.user.id, req.user.id]
    );

    res.json(transactions);
  } catch (err) {
    console.error("[getMyTransactions] error:", err);
    res.status(500).json({ message: "Failed to fetch transactions." });
  }
};

export const getTransactionDetails = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDB();
    const transaction = await db.get(
      `SELECT t.*, 
              c.displayName as citizenName, c.phone as citizenPhone,
              r.businessName as recyclerBusinessName
       FROM transactions t
       LEFT JOIN users c ON t.citizenId = c.id
       LEFT JOIN recycler_profiles r ON t.recyclerId = r.userId
       WHERE t.id = ?`,
      id
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    if (transaction.citizenId !== req.user.id && transaction.recyclerId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: "Access denied." });
    }

    res.json(transaction);
  } catch (err) {
    console.error("[getTransactionDetails] error:", err);
    res.status(500).json({ message: "Failed to fetch transaction details." });
  }
};

export const getEarningsSummary = async (req: any, res: Response) => {
  try {
    const db = await getDB();
    
    let summaryQuery;
    let queryParams;

    if (req.user.role === 'citizen') {
      summaryQuery = `
        SELECT 
          COUNT(*) as totalTransactions,
          SUM(citizenEarnings) as totalEarnings,
          SUM(finalWeightKg) as totalWeightRecycled
        FROM transactions
        WHERE citizenId = ? AND status = 'completed'
      `;
      queryParams = [req.user.id];
    } else if (req.user.role === 'recycler') {
      summaryQuery = `
        SELECT 
          COUNT(*) as totalTransactions,
          SUM(amount) as totalVolumeProcessed,
          SUM(finalWeightKg) as totalWeightRecycled,
          SUM(platformFee) as totalPlatformFees
        FROM transactions
        WHERE recyclerId = ? AND status = 'completed'
      `;
      queryParams = [req.user.id];
    } else {
      return res.status(403).json({ message: "Role not supported for earnings summary." });
    }

    const stats = await db.get(summaryQuery, queryParams);

    const totalTx = stats?.totalTransactions || 0;
    
    if (req.user.role === 'citizen') {
      const totalEarnings = stats?.totalEarnings || 0;
      res.json({
        totalEarnings,
        totalWeightRecycled: stats?.totalWeightRecycled || 0,
        totalTransactions: totalTx,
        averageEarningsPerTransaction: totalTx > 0 ? (totalEarnings / totalTx) : 0,
      });
    } else {
      res.json({
        totalVolumeProcessed: stats?.totalVolumeProcessed || 0,
        totalWeightRecycled: stats?.totalWeightRecycled || 0,
        totalTransactions: totalTx,
        totalPlatformFees: stats?.totalPlatformFees || 0
      });
    }
  } catch (err) {
    console.error("[getEarningsSummary] error:", err);
    res.status(500).json({ message: "Failed to fetch earnings summary." });
  }
};

export const submitFeedback = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Valid rating between 1 and 5 is required." });
    }

    const db = await getDB();
    const transaction = await db.get("SELECT * FROM transactions WHERE id = ?", id);

    if (!transaction) return res.status(404).json({ message: "Transaction not found." });
    if (transaction.citizenId !== req.user.id) return res.status(403).json({ message: "Only the citizen can submit feedback." });
    if (transaction.feedbackRating) return res.status(400).json({ message: "Feedback already submitted for this transaction." });
    if (transaction.status !== 'completed') return res.status(400).json({ message: "Transaction must be completed to submit feedback." });

    // Update transaction with feedback
    await db.run(
      "UPDATE transactions SET feedbackRating = ?, feedbackComment = ? WHERE id = ?",
      [rating, comment || null, id]
    );

    // Update recycler average rating
    const allRatings = await db.all("SELECT feedbackRating FROM transactions WHERE recyclerId = ? AND feedbackRating IS NOT NULL", transaction.recyclerId);
    
    if (allRatings.length > 0) {
      const avg = allRatings.reduce((sum: number, row: any) => sum + row.feedbackRating, 0) / allRatings.length;
      await db.run("UPDATE recycler_profiles SET rating = ? WHERE userId = ?", [avg.toFixed(1), transaction.recyclerId]);
    }

    res.json({ message: "Feedback submitted successfully." });
  } catch (err) {
    console.error("[submitFeedback] error:", err);
    res.status(500).json({ message: "Failed to submit feedback." });
  }
};
