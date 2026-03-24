import { Request, Response } from "express";
import { getDB } from "../db";
import { v4 as uuidv4 } from "uuid";

// 1. Create a Listing (Citizen)
export const createListing = async (req: any, res: Response) => {
  try {
    const { batchId, priceRange } = req.body;
    const userId = req.user.id; // from auth middleware

    if (!batchId) return res.status(400).json({ error: "batchId is required" });

    const db = await getDB();
    
    // Check if batch exists and belongs to user
    const batch = await db.get("SELECT * FROM batches WHERE id = ? AND userId = ?", [batchId, userId]);
    if (!batch) return res.status(404).json({ error: "Batch not found or unauthorized" });

    // Ensure it's not already listed
    const existing = await db.get("SELECT id FROM listings WHERE batchId = ?", [batchId]);
    if (existing) return res.status(400).json({ error: "Batch already listed" });

    const listingId = uuidv4();
    const createdAt = new Date().toISOString();

    await db.run(
      "INSERT INTO listings (id, batchId, userId, status, priceRange, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [listingId, batchId, userId, 'Open', priceRange || '0-50', createdAt]
    );

    // +20 Green Points for moving waste to the exchange
    await db.run("UPDATE users SET greenPoints = COALESCE(greenPoints, 0) + 20 WHERE id = ?", [userId]);

    res.status(201).json({ message: "Listing created", id: listingId });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to create listing" });
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
    
    res.json(listings);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
};

// 3. Place a Bid (Recycler)
export const placeBid = async (req: any, res: Response) => {
  try {
    const listingId = req.params.id;
    const { offerAmount } = req.body;
    const recyclerId = req.user.id;

    if (!offerAmount) return res.status(400).json({ error: "offerAmount is required" });

    const db = await getDB();

    // Ensure listing is Open
    const listing = await db.get("SELECT status, userId FROM listings WHERE id = ?", [listingId]);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.status !== 'Open') return res.status(400).json({ error: "Listing is no longer open" });
    if (listing.userId === recyclerId) return res.status(400).json({ error: "Cannot bid on your own listing" });

    const bidId = uuidv4();
    const createdAt = new Date().toISOString();

    await db.run(
      "INSERT INTO bids (id, listingId, recyclerId, offerAmount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [bidId, listingId, recyclerId, parseFloat(offerAmount), 'Pending', createdAt]
    );

    res.status(201).json({ message: "Bid placed successfully", id: bidId });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to place bid" });
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

    res.json(listings);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user listings" });
  }
};

// 5. Accept Bid (Citizen)
export const acceptBid = async (req: any, res: Response) => {
  try {
    const bidId = req.params.bidId;
    const userId = req.user.id;

    const db = await getDB();
    
    // Verify bid exists and listing belongs to user
    const bidInfo = await db.get(`
      SELECT b.id, b.listingId, l.userId 
      FROM bids b 
      JOIN listings l ON b.listingId = l.id
      WHERE b.id = ?
    `, [bidId]);

    if (!bidInfo) return res.status(404).json({ error: "Bid not found" });
    if (bidInfo.userId !== userId) return res.status(403).json({ error: "Unauthorized" });

    // Mark Bid as Accepted and all other bids on this listing as Rejected
    await db.run("UPDATE bids SET status = 'Rejected' WHERE listingId = ?", [bidInfo.listingId]);
    await db.run("UPDATE bids SET status = 'Accepted' WHERE id = ?", [bidId]);

    // Mark Listing as Assigned
    await db.run("UPDATE listings SET status = 'Assigned' WHERE id = ?", [bidInfo.listingId]);

    // +50 Green Points for finalizing a Circular Economy supply chain link
    await db.run("UPDATE users SET greenPoints = COALESCE(greenPoints, 0) + 50 WHERE id = ?", [userId]);

    res.json({ message: "Bid accepted successfully" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to accept bid" });
  }
};
