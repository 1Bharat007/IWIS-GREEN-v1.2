import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { createListing, getListings, placeBid, getMyListings, acceptBid } from "../controllers/marketplace.controller";

const router = Router();

// Feed: Open to all logged in users (Citizens to view, Recyclers to bid)
router.get("/", protect, getListings);

// Citizen Routes
router.post("/list", protect, createListing);
router.get("/my-listings", protect, getMyListings);
router.post("/bid/:bidId/accept", protect, acceptBid);

// Recycler Routes
router.post("/:id/bid", protect, placeBid);

export default router;
