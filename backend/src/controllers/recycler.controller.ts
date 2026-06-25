import { Request, Response } from "express";
import crypto from "crypto";
import { getDB } from "../db";

export const createProfile = async (req: any, res: Response) => {
  try {
    const { businessName, gstin, acceptedMaterials, serviceRadiusKm, lat, lng } = req.body;

    if (!businessName || !acceptedMaterials || acceptedMaterials.length === 0) {
      return res.status(400).json({ message: "Business name and accepted materials are required" });
    }

    const db = await getDB();
    
    // Check if user is a recycler
    if (req.user.role !== "recycler") {
      return res.status(403).json({ message: "Only recyclers can create a recycler profile" });
    }

    const existing = await db.get("SELECT * FROM recycler_profiles WHERE userId = ?", req.user.id);
    if (existing) {
      await db.run(
        "UPDATE recycler_profiles SET businessName = ?, gstin = ?, acceptedMaterials = ?, serviceRadiusKm = ?, lat = ?, lng = ? WHERE userId = ?",
        [businessName, gstin || null, JSON.stringify(acceptedMaterials), serviceRadiusKm || 5, lat || null, lng || null, req.user.id]
      );
      return res.json({ message: "Profile updated successfully" });
    }

    const id = crypto.randomUUID();
    await db.run(
      "INSERT INTO recycler_profiles (id, userId, businessName, gstin, acceptedMaterials, serviceRadiusKm, lat, lng, isApproved, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, req.user.id, businessName, gstin || null, JSON.stringify(acceptedMaterials), serviceRadiusKm || 5, lat || null, lng || null, 0, new Date().toISOString()]
    );

    res.status(201).json({ message: "Profile created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create profile" });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const db = await getDB();
    const profile = await db.get("SELECT * FROM recycler_profiles WHERE userId = ?", req.user.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    profile.acceptedMaterials = JSON.parse(profile.acceptedMaterials);
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get profile" });
  }
};
