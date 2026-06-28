"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const path_1 = __importDefault(require("path"));
// Execute from backend root using `npx ts-node scripts/seed-demo.ts`
async function seed() {
    console.log("🌱 Starting IWIS demo dataset seeding...");
    // Set DB path explicitly if needed for scripts
    process.env.DB_PATH = path_1.default.resolve("./iwis.db");
    const db = await (0, db_1.getDB)();
    // 1. Create Demo Users
    const citizenId = "demo-citizen-001";
    const recyclerId = "demo-recycler-001";
    const passwordHash = await bcryptjs_1.default.hash("demo123", 10);
    const now = new Date().toISOString();
    console.log("👤 Creating demo users...");
    await db.run(`INSERT OR IGNORE INTO users 
    (id, email, password, role, displayName, phone, greenPoints, tier, totalScans, totalCO2, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [citizenId, "citizen@demo.com", passwordHash, "citizen", "Aryan Sharma", "+919999999991", 450, "Sprout", 12, 14.5, now]);
    await db.run(`INSERT OR IGNORE INTO users 
    (id, email, password, role, displayName, phone, totalEarnings, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [recyclerId, "recycler@demo.com", passwordHash, "recycler", "Green Earth Scrap", "+919999999992", 4520.50, now]);
    // 2. Create Recycler Profile
    console.log("🏢 Creating recycler profile...");
    await db.run(`INSERT OR IGNORE INTO recycler_profiles 
    (id, userId, businessName, acceptedMaterials, serviceRadiusKm, rating, totalPickups, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, ["profile-001", recyclerId, "Green Earth Scrap Ltd", "Plastic, Metal, E-Waste", 15, 4.8, 124, now]);
    // 3. Create Scan Batches (AI History)
    console.log("📷 Creating AI scan history...");
    const batch1 = "batch-001";
    await db.run(`INSERT OR IGNORE INTO batches 
    (id, userId, category, confidence, co2, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)`, [batch1, citizenId, "PET Plastic Bottles", 96, 2.4, now]);
    // 4. Create Listings (Open, Accepted, Completed)
    console.log("📦 Creating waste listings...");
    const listingOpen = "listing-open";
    const listingAccepted = "listing-accepted";
    const listingCompleted = "listing-completed";
    // Open Listing (Visible in Feed)
    await db.run(`INSERT OR IGNORE INTO waste_listings 
    (id, citizenId, materialType, estimatedWeightKg, pickupAddress, lat, lng, status, estimatedValue, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [listingOpen, citizenId, "Metal & E-Waste", 14.5, "123 Green Avenue, Jammu", 32.7266, 74.8570, "listed", 450, now]);
    // Accepted Listing (In Pickup Workflow)
    await db.run(`INSERT OR IGNORE INTO waste_listings 
    (id, citizenId, recyclerId, materialType, estimatedWeightKg, pickupAddress, status, estimatedValue, scheduledDate, scheduledTimeSlot, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [listingAccepted, citizenId, recyclerId, "Cardboard Boxes", 8.0, "123 Green Avenue, Jammu", "accepted", 48, new Date().toISOString().split("T")[0], "Afternoon (12PM - 4PM)", now]);
    // Completed Listing
    await db.run(`INSERT OR IGNORE INTO waste_listings 
    (id, citizenId, recyclerId, materialType, estimatedWeightKg, actualWeightKg, pickupAddress, status, estimatedValue, finalValue, completedAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [listingCompleted, citizenId, recyclerId, "Mixed Plastic", 5.0, 5.2, "123 Green Avenue, Jammu", "completed", 60, 62.4, now, now]);
    // 5. Create Transactions
    console.log("💳 Creating transactions...");
    await db.run(`INSERT OR IGNORE INTO transactions 
    (id, listingId, citizenId, recyclerId, material, finalWeightKg, pricePerKg, amount, platformFee, citizenEarnings, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ["txn-001", listingCompleted, citizenId, recyclerId, "Mixed Plastic", 5.2, 12, 62.4, 0, 62.4, "completed", now]);
    // 6. Create Notifications
    console.log("🔔 Creating notifications...");
    await db.run(`INSERT OR IGNORE INTO notifications 
    (id, userId, title, message, type, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)`, ["notif-001", citizenId, "Pickup Scheduled", "Green Earth Scrap accepted your cardboard listing.", "info", now]);
    console.log("✅ Demo dataset seeded successfully!");
    console.log("Demo Citizen: citizen@demo.com / demo123");
    console.log("Demo Recycler: recycler@demo.com / demo123");
}
seed().catch(console.error);
