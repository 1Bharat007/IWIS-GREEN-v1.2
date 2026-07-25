import { getAuth, clerkClient } from "@clerk/express";
import { getDB } from "../db";
import crypto from "crypto";

export const protect = async (req: any, res: any, next: any) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const db = await getDB();
    let user = await db.get("SELECT id, role, email, clerkId FROM users WHERE clerkId = ?", userId);

    if (!user) {
      // JIT provisioning: Fetch user details from Clerk
      let email: string | null = null;
      let displayName = "Citizen";

      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
          const primary = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId);
          email = primary ? primary.emailAddress : clerkUser.emailAddresses[0].emailAddress;
        }
        const nameParts = [clerkUser.firstName, clerkUser.lastName].filter(Boolean);
        if (nameParts.length > 0) {
          displayName = nameParts.join(" ");
        } else if (clerkUser.username) {
          displayName = clerkUser.username;
        }
      } catch (clerkErr) {
        console.warn("[auth.middleware] Could not fetch Clerk user profile:", clerkErr);
      }

      // Check if a pre-Clerk legacy account exists with this email
      if (email) {
        const legacyUser = await db.get("SELECT id, role FROM users WHERE email = ? AND clerkId IS NULL", email);
        if (legacyUser) {
          await db.run("UPDATE users SET clerkId = ? WHERE id = ?", [userId, legacyUser.id]);
          user = { id: legacyUser.id, role: legacyUser.role, email, clerkId: userId };
          console.log(`[auth.middleware] Linked legacy user ${legacyUser.id} to Clerk user ${userId}`);
        }
      }

      // If no matching legacy account, create a new user row
      if (!user) {
        const newId = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        await db.run(
          "INSERT INTO users (id, clerkId, email, role, displayName, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
          [newId, userId, email, "citizen", displayName, createdAt]
        );
        user = { id: newId, role: "citizen", email, clerkId: userId };
        console.log(`[auth.middleware] Created new user ${newId} for Clerk user ${userId}`);
      }
    }

    req.user = {
      id: user.id,
      clerkId: userId,
      role: user.role || "citizen"
    };

    next();
  } catch (err: any) {
    console.error("[auth.middleware] Error verifying Clerk session:", err);
    return res.status(401).json({ message: "Invalid session or authentication failed" });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};
