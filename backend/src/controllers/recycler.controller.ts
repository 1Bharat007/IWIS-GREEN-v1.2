import { AppError, ValidationError, AuthenticationError, AuthorizationError, DatabaseError } from "../utils/errors";
import { sendSuccess } from "../utils/apiResponse.util";
import { Request, Response } from "express";
import crypto from "crypto";
import { getDB } from "../db";

export const createProfile = async (req: any, res: Response) => {
  try {
    const { businessName, gstin, acceptedMaterials, serviceRadiusKm, lat, lng } = req.body;

    if (!businessName || !acceptedMaterials || acceptedMaterials.length === 0) {
      throw new ValidationError("Business name and accepted materials are required");
    }

    const db = await getDB();
    
    // Check if user is a recycler
    if (req.user.role !== "recycler") {
      throw new AuthorizationError("Only recyclers can create a recycler profile");
    }

    const existing = await db.get("SELECT * FROM recycler_profiles WHERE userId = ?", req.user.id);
    if (existing) {
      await db.run(
        "UPDATE recycler_profiles SET businessName = ?, gstin = ?, acceptedMaterials = ?, serviceRadiusKm = ?, lat = ?, lng = ? WHERE userId = ?",
        [businessName, gstin || null, JSON.stringify(acceptedMaterials), serviceRadiusKm || 5, lat || null, lng || null, req.user.id]
      );
      return sendSuccess(res, { message: "Profile updated successfully" });
    }

    const id = crypto.randomUUID();
    await db.run(
      "INSERT INTO recycler_profiles (id, userId, businessName, gstin, acceptedMaterials, serviceRadiusKm, lat, lng, isApproved, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, req.user.id, businessName, gstin || null, JSON.stringify(acceptedMaterials), serviceRadiusKm || 5, lat || null, lng || null, 0, new Date().toISOString()]
    );

    sendSuccess(res, { message: "Profile created successfully" });
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Failed to create profile");
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const db = await getDB();
    const profile = await db.get("SELECT * FROM recycler_profiles WHERE userId = ?", req.user.id);
    if (!profile) {
      throw new ValidationError("Profile not found");
    }
    profile.acceptedMaterials = JSON.parse(profile.acceptedMaterials);
    sendSuccess(res, profile);
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Failed to get profile");
  }
};

import { getSmartListingsForRecycler, getRecyclerDashboardStats } from "../services/recycler.service";

export const getSmartListings = async (req: any, res: Response) => {
  try {
    const listings = await getSmartListingsForRecycler(req.user.id);
    sendSuccess(res, listings);
  } catch (err) {
    console.error("[getSmartListings] error:", err);
    throw new DatabaseError("Failed to load smart listings");
  }
};

export const getDashboard = async (req: any, res: Response) => {
  try {
    const stats = await getRecyclerDashboardStats(req.user.id);
    sendSuccess(res, stats);
  } catch (err) {
    console.error("[getRecyclerDashboard] error:", err);
    throw new DatabaseError("Failed to load recycler dashboard");
  }
};
