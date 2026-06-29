import { Request, Response } from "express";
import crypto from "crypto";
import { getDB } from "../db";
import { createNotification } from "./notification.controller";

export const createListing = async (req: any, res: Response) => {
  try {
    const { materialType, wasteVolume, estimatedWeightKg, photoUrl, description, pickupAddress, lat, lng } = req.body;

    if (!materialType || !pickupAddress || (!wasteVolume && !estimatedWeightKg)) {
      return res.status(400).json({ message: "Material type, pickup address, and a quantity (volume or weight) are required." });
    }

    if (photoUrl && photoUrl.length > 700000) { // ~500KB base64
      return res.status(400).json({ message: "Image is too large. Maximum allowed size is 500 KB." });
    }

    if (req.user.role !== "citizen") {
      return res.status(403).json({ message: "Only citizens can create waste listings." });
    }

    let finalLat = lat;
    let finalLng = lng;
    let finalStatus = 'listed';

    if (!finalLat || !finalLng) {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupAddress)}`, {
          headers: { 'User-Agent': 'IWIS-Beta/1.0' }
        });
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          finalLat = parseFloat(geoData[0].lat);
          finalLng = parseFloat(geoData[0].lon);
        }
      } catch (err) {
        console.error("Geocoding failed during creation", err);
      }
    }

    if (!finalLat || !finalLng) {
      finalStatus = 'location_pending';
    }

    const db = await getDB();
    const id = crypto.randomUUID();

    await db.run(
      `INSERT INTO waste_listings (
        id, citizenId, materialType, wasteVolume, estimatedWeightKg, photoUrl, description, 
        pickupAddress, lat, lng, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        req.user.id, 
        materialType,
        wasteVolume || null, 
        estimatedWeightKg || 0, 
        photoUrl || null, 
        description || null, 
        pickupAddress, 
        finalLat || null, 
        finalLng || null, 
        finalStatus, 
        new Date().toISOString()
      ]
    );

    await createNotification(
      req.user.id,
      "Listing Created",
      `Your ${materialType} waste listing was successfully created.`
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
      `SELECT wl.*, 
              u.displayName as recyclerName, u.phone as recyclerPhone,
              rp.businessName as recyclerBusinessName, rp.rating as recyclerRating, rp.isApproved as recyclerVerified
       FROM waste_listings wl
       LEFT JOIN users u ON wl.recyclerId = u.id
       LEFT JOIN recycler_profiles rp ON wl.recyclerId = rp.userId
       WHERE wl.citizenId = ? 
       ORDER BY wl.createdAt DESC`,
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
        if (!listing.lat || !listing.lng) return false; // Fixed: Do not expose globally
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

    // Atomic conditional update to prevent race conditions
    const result = await db.run(
      "UPDATE waste_listings SET status = 'accepted', recyclerId = ?, updatedAt = ? WHERE id = ? AND status = 'listed'",
      [req.user.id, new Date().toISOString(), id]
    );

    if (result.changes === 0) {
      return res.status(409).json({ message: "This listing has already been accepted by another recycler." });
    }

    // Notify citizen (Fetch citizen id via listing query since we skipped the pre-select)
    const updatedListing = await db.get("SELECT citizenId FROM waste_listings WHERE id = ?", id);
    if (updatedListing) {
      const recyclerProfile = await db.get("SELECT businessName FROM recycler_profiles WHERE userId = ?", req.user.id);
      const recyclerName = recyclerProfile?.businessName || req.user.displayName || "A recycler";
      await createNotification(
        updatedListing.citizenId,
        "Listing Accepted",
        `${recyclerName} has accepted your waste listing and will schedule a pickup soon.`
      );
    }

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

    // Notify citizen
    await createNotification(
      listing.citizenId,
      "Pickup Scheduled",
      `Your pickup is scheduled for ${new Date(scheduledDate).toLocaleDateString()} between ${scheduledTimeSlot}.`
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
    const { actualWeightKg, pickupPhotoUrl, paymentMethod = 'cash' } = req.body;
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
      [txId, id, listing.citizenId, req.user.id, listing.materialType, weight, pricePerKg, totalAmount, platformFee, citizenEarnings, paymentMethod, 'completed', 'completed', now]
    );

    await db.run(
      "UPDATE users SET totalEarnings = COALESCE(totalEarnings, 0) + ? WHERE id = ?",
      [citizenEarnings, listing.citizenId]
    );

    // Notify citizen
    await createNotification(
      listing.citizenId,
      "Pickup Completed",
      `Your waste was picked up successfully. You earned ₹${citizenEarnings.toFixed(2)}.`
    );
    await createNotification(
      listing.citizenId,
      "Payment Recorded",
      `A ${paymentMethod === 'upi' ? 'UPI' : 'cash'} payment of ₹${citizenEarnings.toFixed(2)} was recorded for your listing.`
    );

    res.json({ message: "Pickup confirmed and transaction generated." });
  } catch (err) {
    console.error("[confirmPickup] error:", err);
    res.status(500).json({ message: "Failed to confirm pickup." });
  }
};
