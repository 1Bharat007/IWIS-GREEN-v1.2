import { Request, Response } from "express";
import crypto from "crypto";
import { getDB } from "../db";

export const createListing = async (req: any, res: Response) => {
  try {
    const { materialType, estimatedWeightKg, photoUrl, description, pickupAddress, lat, lng } = req.body;

    if (!materialType || !estimatedWeightKg || !pickupAddress) {
      return res.status(400).json({ message: "Material type, weight, and pickup address are required." });
    }

    if (req.user.role !== "citizen") {
      return res.status(403).json({ message: "Only citizens can create waste listings." });
    }

    const db = await getDB();
    const id = crypto.randomUUID();

    await db.run(
      `INSERT INTO waste_listings (
        id, citizenId, materialType, estimatedWeightKg, photoUrl, description, 
        pickupAddress, lat, lng, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        req.user.id, 
        materialType, 
        estimatedWeightKg, 
        photoUrl || null, 
        description || null, 
        pickupAddress, 
        lat || null, 
        lng || null, 
        'listed', 
        new Date().toISOString()
      ]
    );

    res.status(201).json({ message: "Listing created successfully.", id });
  } catch (err) {
    console.error("[createListing] error:", err);
    res.status(500).json({ message: "Failed to create listing." });
  }
};

export const getMyListings = async (req: any, res: Response) => {
  try {
    const db = await getDB();
    const listings = await db.all(
      "SELECT * FROM waste_listings WHERE citizenId = ? ORDER BY createdAt DESC",
      req.user.id
    );
    res.json(listings);
  } catch (err) {
    console.error("[getMyListings] error:", err);
    res.status(500).json({ message: "Failed to fetch listings." });
  }
};

export const getNearbyListings = async (req: any, res: Response) => {
  try {
    if (req.user.role !== "recycler") {
      return res.status(403).json({ message: "Only recyclers can access the feed." });
    }

    const { lat, lng, radiusKm = 10 } = req.query;

    const db = await getDB();
    const listings = await db.all(
      `SELECT wl.*, u.displayName as citizenName 
       FROM waste_listings wl 
       LEFT JOIN users u ON wl.citizenId = u.id 
       WHERE wl.status = 'listed' 
       ORDER BY wl.createdAt DESC`
    );

    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const maxRadius = parseFloat(radiusKm as string);

      const toRad = (value: number) => (value * Math.PI) / 180;
      const R = 6371; // km

      const filtered = listings.filter((listing: any) => {
        if (!listing.lat || !listing.lng) return true; // keep listings without strict coordinates for MVP demo
        const dLat = toRad(listing.lat - userLat);
        const dLon = toRad(listing.lng - userLng);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(userLat)) * Math.cos(toRad(listing.lat)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        listing.distanceKm = distance.toFixed(1);
        return distance <= maxRadius;
      });
      return res.json(filtered);
    }

    res.json(listings);
  } catch (err) {
    console.error("[getNearbyListings] error:", err);
    res.status(500).json({ message: "Failed to fetch nearby listings." });
  }
};

export const acceptListing = async (req: any, res: Response) => {
  try {
    if (req.user.role !== "recycler") {
      return res.status(403).json({ message: "Only recyclers can accept listings." });
    }

    const { id } = req.params;
    const db = await getDB();

    // Ensure it's still open
    const listing = await db.get("SELECT status FROM waste_listings WHERE id = ?", id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }
    if (listing.status !== 'listed') {
      return res.status(400).json({ message: "Listing is no longer available." });
    }

    // Update status to accepted and set recyclerId
    await db.run(
      "UPDATE waste_listings SET status = 'accepted', recyclerId = ?, updatedAt = ? WHERE id = ?",
      [req.user.id, new Date().toISOString(), id]
    );

    res.json({ message: "Listing accepted successfully." });
  } catch (err) {
    console.error("[acceptListing] error:", err);
    res.status(500).json({ message: "Failed to accept listing." });
  }
};

export const getListing = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDB();
    const listing = await db.get(
      `SELECT wl.*, u.displayName as citizenName, u.phone as citizenPhone 
       FROM waste_listings wl 
       LEFT JOIN users u ON wl.citizenId = u.id 
       WHERE wl.id = ?`,
      id
    );
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json(listing);
  } catch (err) {
    console.error("[getListing] error:", err);
    res.status(500).json({ message: "Failed to fetch listing." });
  }
};

export const schedulePickup = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTimeSlot } = req.body;
    if (!scheduledDate || !scheduledTimeSlot) return res.status(400).json({ message: "Date and time slot required." });

    const db = await getDB();
    const listing = await db.get("SELECT status, recyclerId FROM waste_listings WHERE id = ?", id);
    if (!listing) return res.status(404).json({ message: "Not found." });
    if (listing.recyclerId !== req.user.id) return res.status(403).json({ message: "Not your pickup." });
    if (listing.status !== 'accepted') return res.status(400).json({ message: "Listing must be accepted first." });

    await db.run(
      "UPDATE waste_listings SET status = 'scheduled', scheduledDate = ?, scheduledTimeSlot = ?, updatedAt = ? WHERE id = ?",
      [scheduledDate, scheduledTimeSlot, new Date().toISOString(), id]
    );

    res.json({ message: "Pickup scheduled." });
  } catch (err) {
    console.error("[schedulePickup] error:", err);
    res.status(500).json({ message: "Failed to schedule pickup." });
  }
};

export const confirmPickup = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { actualWeightKg, pickupPhotoUrl } = req.body;
    const weight = parseFloat(actualWeightKg);
    if (isNaN(weight) || weight <= 0) {
      return res.status(400).json({ message: "Invalid weight. Must be greater than 0." });
    }

    const db = await getDB();
    const listing = await db.get("SELECT * FROM waste_listings WHERE id = ?", id);
    if (!listing) return res.status(404).json({ message: "Not found." });
    if (listing.recyclerId !== req.user.id) return res.status(403).json({ message: "Not your pickup." });
    if (listing.status === 'completed') return res.status(400).json({ message: "Listing already completed." });
    if (listing.status !== 'scheduled' && listing.status !== 'accepted') return res.status(400).json({ message: "Invalid status." });

    // Query Scrap Price Engine
    const priceRecord = await db.get("SELECT pricePerKg FROM scrap_prices WHERE material = ? LIMIT 1", listing.materialType);
    if (!priceRecord || priceRecord.pricePerKg < 0) {
      return res.status(400).json({ message: "Missing or invalid scrap price for this material." });
    }
    const pricePerKg = priceRecord.pricePerKg;

    const totalAmount = weight * pricePerKg;
    const platformFee = totalAmount * 0.02;
    const citizenEarnings = totalAmount - platformFee;

    const now = new Date().toISOString();

    await db.run(
      "UPDATE waste_listings SET status = 'completed', actualWeightKg = ?, pickupPhotoUrl = ?, finalValue = ?, completedAt = ?, updatedAt = ? WHERE id = ?",
      [weight, pickupPhotoUrl || null, totalAmount, now, now, id]
    );

    const txId = crypto.randomUUID();
    await db.run(
      `INSERT INTO transactions (
        id, listingId, citizenId, recyclerId, material, finalWeightKg, pricePerKg, 
        amount, platformFee, citizenEarnings, paymentMethod, paymentStatus, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txId, id, listing.citizenId, req.user.id, listing.materialType, weight, pricePerKg, totalAmount, platformFee, citizenEarnings, 'cash', 'pending', 'completed', now]
    );

    await db.run(
      "UPDATE users SET totalEarnings = COALESCE(totalEarnings, 0) + ? WHERE id = ?",
      [citizenEarnings, listing.citizenId]
    );

    res.json({ message: "Pickup confirmed and transaction generated." });
  } catch (err) {
    console.error("[confirmPickup] error:", err);
    res.status(500).json({ message: "Failed to confirm pickup." });
  }
};
