import { Router } from "express";
import { getPrices, updatePrice } from "../controllers/price.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Public endpoint to get prices
router.get("/", getPrices);

// Admin-only endpoint to update prices
router.put("/:id", protect, updatePrice);

export default router;
