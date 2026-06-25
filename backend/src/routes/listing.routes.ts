import { Router } from "express";
import { createListing, getMyListings, getNearbyListings, acceptListing, getListing, schedulePickup, confirmPickup } from "../controllers/listing.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/", protect, createListing);
router.get("/my", protect, getMyListings);
router.get("/nearby", protect, getNearbyListings);
router.post("/:id/accept", protect, acceptListing);
router.get("/:id", protect, getListing);
router.post("/:id/schedule", protect, schedulePickup);
router.post("/:id/confirm", protect, confirmPickup);

export default router;
