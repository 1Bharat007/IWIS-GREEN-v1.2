import { getDB } from "../src/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import path from "path";

// Execute from backend root using `npx ts-node scripts/seed-demo.ts`

async function seed() {
  console.log("🌱 Starting IWIS demo dataset seeding...");
  
  // Set DB path explicitly if needed for scripts
  process.env.DB_PATH = path.resolve("./iwis.db");
  const db = await getDB();

  // 1. Create Demo Users
  const citizenId = "demo-citizen-001";
  const recyclerId = "demo-recycler-001";
  const passwordHash = await bcrypt.hash("password123", 10);
  const now = new Date().toISOString();

  console.log("👤 Creating/Updating demo users...");
  // Try to update existing users first to avoid foreign key constraints
  await db.run(`UPDATE users SET email = ?, password = ?, phone = ? WHERE id = ?`, ["demo@iwis.app", passwordHash, "+919596310276", citizenId]);
  await db.run(`UPDATE users SET email = ?, password = ?, phone = ? WHERE id = ?`, ["recycler@iwis.app", passwordHash, "+919596310277", recyclerId]);
  
  await db.run(`INSERT OR IGNORE INTO users 
    (id, email, password, role, displayName, phone, city, greenPoints, tier, totalScans, totalCO2, totalEarnings, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [citizenId, "demo@iwis.app", passwordHash, "citizen", "Aryan Sharma", "+919596310276", "Delhi", 450, "Sprout", 12, 14.5, 450.50, now]
  );

  await db.run(`INSERT OR IGNORE INTO users 
    (id, email, password, role, displayName, phone, city, totalEarnings, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [recyclerId, "recycler@iwis.app", passwordHash, "recycler", "Green Earth Scrap", "+919596310277", "Delhi", 4520.50, now]
  );

  // 2. Create Recycler Profile
  console.log("🏢 Creating recycler profile...");
  await db.run(`INSERT OR REPLACE INTO recycler_profiles 
    (id, userId, businessName, acceptedMaterials, serviceRadiusKm, rating, totalPickups, isApproved, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["profile-001", recyclerId, "Green Earth Scrap Ltd", "Plastic, Metal, E-Waste", 15, 4.8, 124, 1, now]
  );

  // 3. Create Scan Batches (AI History)
  console.log("📷 Creating AI scan history...");
  const batch1 = "batch-001";
  await db.run(`INSERT OR IGNORE INTO batches 
    (id, userId, category, confidence, co2, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [batch1, citizenId, "PET Plastic Bottles", 96, 2.4, now]
  );

  // 4. Create Listings (Open, Accepted, Completed)
  console.log("📦 Creating waste listings...");
  const listingOpen = "listing-open";
  const listingAccepted = "listing-accepted";
  const listingCompleted = "listing-completed";

  // Open Listing (Visible in Feed)
  await db.run(`INSERT OR IGNORE INTO waste_listings 
    (id, citizenId, materialType, estimatedWeightKg, pickupAddress, lat, lng, status, estimatedValue, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [listingOpen, citizenId, "Metal & E-Waste", 14.5, "123 Green Avenue, Jammu", 32.7266, 74.8570, "listed", 450, now]
  );

  // Accepted Listing (In Pickup Workflow)
  await db.run(`INSERT OR IGNORE INTO waste_listings 
    (id, citizenId, recyclerId, materialType, estimatedWeightKg, pickupAddress, status, estimatedValue, scheduledDate, scheduledTimeSlot, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [listingAccepted, citizenId, recyclerId, "Cardboard Boxes", 8.0, "123 Green Avenue, Jammu", "accepted", 48, new Date().toISOString().split("T")[0], "Afternoon (12PM - 4PM)", now]
  );

  // Completed Listing
  await db.run(`INSERT OR IGNORE INTO waste_listings 
    (id, citizenId, recyclerId, materialType, estimatedWeightKg, actualWeightKg, pickupAddress, status, estimatedValue, finalValue, completedAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [listingCompleted, citizenId, recyclerId, "Mixed Plastic", 5.0, 5.2, "123 Green Avenue, Jammu", "completed", 60, 62.4, now, now]
  );

  // 5. Create Transactions
  console.log("💳 Creating transactions...");
  await db.run(`INSERT OR IGNORE INTO transactions 
    (id, listingId, citizenId, recyclerId, material, finalWeightKg, pricePerKg, amount, platformFee, citizenEarnings, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["txn-001", listingCompleted, citizenId, recyclerId, "Mixed Plastic", 5.2, 12, 62.4, 0, 62.4, "completed", now]
  );

  // 6. Create Notifications
  console.log("🔔 Creating notifications...");
  await db.run(`INSERT OR IGNORE INTO notifications 
    (id, userId, title, message, type, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)`,
    ["notif-001", citizenId, "Pickup Scheduled", "Green Earth Scrap accepted your cardboard listing.", "info", now]
  );

  console.log("✅ Demo dataset seeded successfully!");
  console.log("Demo Citizen: demo@iwis.app / password123");
  console.log("Demo Recycler: recycler@iwis.app / password123");
}

seed().catch(console.error);
