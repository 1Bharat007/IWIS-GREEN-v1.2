import { sendSuccess } from "../utils/apiResponse.util";
import { AppError, ValidationError, AuthenticationError, AuthorizationError, DatabaseError } from "../utils/errors";
import { Request, Response } from "express";
import { getDB, withTransaction } from "../db";
import { roundMoney } from "../utils/money";
import crypto from "crypto";
const uuidv4 = () => crypto.randomUUID();

// 1. Create a Listing (Citizen)
export const createListing = async (req: any, res: Response) => {
  try {
    const { batchId, priceRange } = req.body;
    const userId = req.user.id;

    if (!batchId) throw new ValidationError("batchId is required.");

    const db = await getDB();
    
    // Check if batch exists and belongs to user
    const batch = await db.get("SELECT * FROM batches WHERE id = ? AND userId = ?", [batchId, userId]);
    if (!batch) throw new ValidationError("Batch not found or unauthorized.");

    // Ensure it's not already listed
    const existing = await db.get("SELECT id FROM listings WHERE batchId = ?", [batchId]);
    if (existing) throw new ValidationError("Batch already listed.");

    const listingId = uuidv4();
    const createdAt = new Date().toISOString();

    await db.run(
      "INSERT INTO listings (id, batchId, userId, status, priceRange, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [listingId, batchId, userId, 'Open', priceRange || '0-50', createdAt]
    );

    // +20 Green Points for moving waste to the exchange
    await db.run("UPDATE users SET greenPoints = COALESCE(greenPoints, 0) + 20 WHERE id = ?", [userId]);

    sendSuccess(res, { message: "Listing created", id: listingId });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error("[createListing] error:", err);
    throw new DatabaseError("Failed to create listing.");
  }
};

// 2. Get All Open Listings (Feed for Recyclers / Users)
export const getListings = async (req: any, res: Response) => {
  try {
    const db = await getDB();
    // Join with batches to get details about the waste
    const listings = await db.all(`
      SELECT 
        l.id as listingId, l.status, l.priceRange, l.createdAt,
        b.category, b.confidence, b.co2, b.timestamp, b.imageHash,
        u.email as ownerEmail
      FROM listings l
      JOIN batches b ON l.batchId = b.id
      JOIN users u ON l.userId = u.id
      WHERE l.status = 'Open'
      ORDER BY l.createdAt DESC
    `);
    
    sendSuccess(res, listings);
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error("[getListings] error:", err);
    throw new DatabaseError("Failed to fetch listings.");
  }
};

// 3. Place a Bid (Recycler)
export const placeBid = async (req: any, res: Response) => {
  try {
    const listingId = req.params.id;
    const { offerAmount } = req.body;
    const recyclerId = req.user.id;

    if (offerAmount === undefined || offerAmount === null) {
      throw new ValidationError("offerAmount is required.");
    }

    const parsedAmount = typeof offerAmount === "number" ? offerAmount : parseFloat(offerAmount);
    const amount = roundMoney(parsedAmount);
    if (isNaN(amount) || amount <= 0) {
      throw new ValidationError("Valid offer amount greater than 0 is required.");
    }
    if (amount > 100000) {
      throw new ValidationError("Bid offer amount exceeds the ₹1,00,000 maximum limit.");
    }

    const db = await getDB();

    // Ensure listing is Open
    const listing = await db.get("SELECT status, userId FROM listings WHERE id = ?", [listingId]);
    if (!listing) throw new ValidationError("Listing not found.");
    if (listing.status !== 'Open') throw new ValidationError("Listing is no longer open.");
    if (listing.userId === recyclerId) throw new AuthorizationError("Cannot bid on your own listing.");

    const bidId = uuidv4();
    const createdAt = new Date().toISOString();

    await db.run(
      "INSERT INTO bids (id, listingId, recyclerId, offerAmount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [bidId, listingId, recyclerId, amount, 'Pending', createdAt]
    );

    sendSuccess(res, { message: "Bid placed successfully", id: bidId });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error("[placeBid] error:", err);
    throw new DatabaseError("Failed to place bid.");
  }
};

// 4. Get My Listings & Bids (Dashboard view for citizens)
export const getMyListings = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const db = await getDB();
    
    const listings = await db.all(`
      SELECT 
        l.id as listingId, l.status, l.priceRange, l.createdAt,
        b.category, b.co2
      FROM listings l
      JOIN batches b ON l.batchId = b.id
      WHERE l.userId = ?
      ORDER BY l.createdAt DESC
    `, [userId]);

    // Attach bids to listings
    for (const listing of listings) {
      const bids = await db.all(`
        SELECT b.id as bidId, b.offerAmount, b.status, b.createdAt, u.email as bidderEmail
        FROM bids b
        JOIN users u ON b.recyclerId = u.id
        WHERE b.listingId = ?
        ORDER BY b.offerAmount DESC
      `, [listing.listingId]);
      listing.bids = bids;
    }

    sendSuccess(res, listings);
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error("[getMyListings] error:", err);
    throw new DatabaseError("Failed to fetch user listings.");
  }
};

// 5. Accept Bid (Citizen)
export const acceptBid = async (req: any, res: Response) => {
  try {
    const bidId = req.params.bidId;
    const userId = req.user.id;

    const db = await getDB();
    
    // Verify bid exists, listing belongs to user, and listing is currently 'Open'
    const bidInfo = await db.get(`
      SELECT b.id, b.listingId, l.userId, l.status as listingStatus 
      FROM bids b 
      JOIN listings l ON b.listingId = l.id
      WHERE b.id = ?
    `, [bidId]);

    if (!bidInfo) throw new ValidationError("Bid not found.");
    if (bidInfo.userId !== userId) throw new AuthorizationError("Unauthorized to accept bids on this listing.");
    if (bidInfo.listingStatus !== 'Open') {
      return res.status(409).json({ message: "This listing has already been assigned or closed." });
    }

    let isAlreadyAssigned = false;

    // Atomic status gate + DB Transaction (withTransaction)
    await withTransaction(async (tx) => {
      const result = await tx.run(
        "UPDATE listings SET status = 'Assigned' WHERE id = ? AND status = 'Open'",
        [bidInfo.listingId]
      );

      if (!result || result.changes === 0) {
        isAlreadyAssigned = true;
        return;
      }

      // Mark all other bids on this listing as Rejected
      await tx.run("UPDATE bids SET status = 'Rejected' WHERE listingId = ?", [bidInfo.listingId]);
      // Mark winning Bid as Accepted
      await tx.run("UPDATE bids SET status = 'Accepted' WHERE id = ?", [bidId]);

      // +50 Green Points for finalizing a Circular Economy supply chain link
      await tx.run("UPDATE users SET greenPoints = COALESCE(greenPoints, 0) + 50 WHERE id = ?", [userId]);
    });

    if (isAlreadyAssigned) {
      return res.status(409).json({ message: "This listing has already been assigned." });
    }

    sendSuccess(res, { message: "Bid accepted successfully" });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error("[acceptBid] error:", err);
    throw new DatabaseError("Failed to accept bid.");
  }
};
