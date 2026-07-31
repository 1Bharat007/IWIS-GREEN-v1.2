import { AppError, ValidationError, DatabaseError } from "../utils/errors";
import { sendSuccess } from "../utils/apiResponse.util";
import { Response } from "express";
import { getDB } from "../db";

// ─── GET MY PROFILE ───────────────────────────────────────────────────────────
export const getMe = async (req: any, res: Response) => {
  try {
    const db = await getDB();
    const user = await db.get(
      `SELECT u.id, u.email, u.phone, u.displayName, u.role, u.totalScans, u.totalCO2, u.streak, u.tier, 
              u.greenPoints, u.createdAt, u.totalEarnings, u.city, u.upiId, u.clerkId, r.isApproved 
       FROM users u 
       LEFT JOIN recycler_profiles r ON u.id = r.userId 
       WHERE u.id = ?`,
      req.user.id
    );
    if (!user) throw new ValidationError("User not found");

    // Aggregate stats
    let completedPickups = 0;
    let successfulListings = 0;
    let totalWasteRecycledKg = 0;
    let recyclerRating = 4.8; // Default mock rating

    if (user.role === 'citizen') {
      const stats = await db.get("SELECT COUNT(*) as count, SUM(estimatedWeightKg) as weight FROM waste_listings WHERE citizenId = ? AND status = 'completed'", user.id);
      successfulListings = stats?.count || 0;
      totalWasteRecycledKg = stats?.weight || 0;
    } else {
      const stats = await db.get("SELECT COUNT(*) as count, SUM(estimatedWeightKg) as weight FROM waste_listings WHERE recyclerId = ? AND status = 'completed'", user.id);
      completedPickups = stats?.count || 0;
      totalWasteRecycledKg = stats?.weight || 0;
      
      const rating = await db.get("SELECT averageRating FROM recycler_profiles WHERE userId = ?", user.id);
      if (rating && rating.averageRating) recyclerRating = rating.averageRating;
    }

    sendSuccess(res, {
      ...user,
      requiresOnboarding: user.role === 'recycler' && !user.isApproved,
      completedPickups,
      successfulListings,
      totalWasteRecycledKg,
      recyclerRating
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error("[getMe] error:", err);
    throw new DatabaseError("Failed to load profile.");
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
const upiRegex = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { displayName, upiId } = req.body;
    const db = await getDB();

    if (upiId !== undefined && upiId !== null && upiId !== "") {
      if (typeof upiId !== "string" || !upiRegex.test(upiId.trim())) {
        throw new ValidationError("Invalid UPI ID format (e.g., name@upi).");
      }
    }

    const existingUser = await db.get("SELECT displayName, upiId FROM users WHERE id = ?", req.user.id);
    const updatedDisplayName = (typeof displayName === "string" && displayName.trim().length > 0)
      ? displayName.trim().slice(0, 60)
      : existingUser?.displayName;
    const updatedUpiId = (typeof upiId === "string") ? (upiId.trim() || null) : existingUser?.upiId;

    await db.run(
      "UPDATE users SET displayName = ?, upiId = ? WHERE id = ?",
      [updatedDisplayName, updatedUpiId, req.user.id]
    );

    sendSuccess(res, {
      message: "Profile updated.",
      displayName: updatedDisplayName,
      upiId: updatedUpiId
    });
  } catch (err: any) {
    if (err instanceof ValidationError) throw err;
    console.error("[updateProfile] error:", err);
    throw new DatabaseError("Failed to update profile.");
  }
};

// ─── SET ROLE (ONBOARDING) ─────────────────────────────────────────────────────
export const setRole = async (req: any, res: Response) => {
  try {
    const { role } = req.body;
    if (role !== "citizen" && role !== "recycler") {
      throw new ValidationError("Role must be 'citizen' or 'recycler'.");
    }

    const db = await getDB();
    await db.run("UPDATE users SET role = ? WHERE id = ?", [role, req.user.id]);

    sendSuccess(res, { message: "Role updated successfully.", role });
  } catch (err: any) {
    if (err instanceof ValidationError) throw err;
    console.error("[setRole] error:", err);
    throw new DatabaseError("Failed to set role.");
  }
};
