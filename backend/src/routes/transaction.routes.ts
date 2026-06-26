import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getMyTransactions, getEarningsSummary, getTransactionDetails, submitFeedback } from "../controllers/transaction.controller";

const router = Router();

// Order is important: summary must be above /:id
router.get("/summary", protect, getEarningsSummary);
router.get("/:id", protect, getTransactionDetails);
router.post("/:id/feedback", protect, submitFeedback);
router.get("/", protect, getMyTransactions);

export default router;
