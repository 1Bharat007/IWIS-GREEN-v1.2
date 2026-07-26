import { getDB } from "../src/db";
import crypto from "crypto";
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
  const now = new Date().toISOString();

  console.log("👤 Creating/Updating demo users...");
  // Try to update existing users first to avoid foreign key constraints
  await db.run(`UPDATE users SET email = ?, phone = ?, clerkId = ? WHERE id = ?`, ["demo@iwis.app", "+919596310276", "user_demo_citizen", citizenId]);
  await db.run(`UPDATE users SET email = ?, phone = ?, clerkId = ? WHERE id = ?`, ["recycler@iwis.app", "+919596310277", "user_demo_recycler", recyclerId]);
  
  await db.run(`INSERT OR IGNORE INTO users 
    (id, email, clerkId, role, displayName, phone, city, greenPoints, tier, totalScans, totalCO2, totalEarnings, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [citizenId, "demo@iwis.app", "user_demo_citizen", "citizen", "Aryan Sharma", "+919596310276", "Delhi", 450, "Sprout", 12, 14.5, 450.50, now]
  );

  await db.run(`INSERT OR IGNORE INTO users 
    (id, email, clerkId, role, displayName, phone, city, totalEarnings, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [recyclerId, "recycler@iwis.app", "user_demo_recycler", "recycler", "Green Earth Scrap", "+919596310277", "Delhi", 4520.50, now]
  );

  // 2. Create Recycler Profile
  console.log("🏢 Creating recycler profile...");
  await db.run(`INSERT OR REPLACE INTO recycler_profiles 
    (id, userId, businessName, gstin, acceptedMaterials, serviceRadiusKm, lat, lng, rating, totalPickups, isApproved, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), recyclerId, "Green Earth Scrap", "07AAAAA0000A1Z5", '["Paper","Plastic","Metal","E-Waste"]', 10, 28.6139, 77.2090, 4.8, 142, 1, now]
  );

  // 3. Create Sample Waste Listings
  console.log("📦 Creating sample waste listings...");
  const listings = [
    {
      id: "listing-001",
      material: "Paper & Cardboard",
      weight: 15.5,
      value: 93.00,
      status: "listed",
      desc: "Clean cardboard boxes from moving + old newspapers",
      address: "Connaught Place, Block C, New Delhi"
    },
    {
      id: "listing-002",
      material: "Plastic Bottles (PET)",
      weight: 8.0,
      value: 96.00,
      status: "scheduled",
      desc: "Crushed PET water bottles and beverage containers",
      address: "Lajpat Nagar IV, New Delhi",
      recycler: recyclerId
    },
    {
      id: "listing-003",
      material: "E-Waste (Old Electronics)",
      weight: 4.2,
      value: 126.00,
      status: "completed",
      desc: "Old computer monitor, broken keyboard, and copper wiring",
      address: "Nehru Place, New Delhi",
      recycler: recyclerId
    }
  ];

  for (const l of listings) {
    await db.run(`INSERT OR REPLACE INTO waste_listings 
      (id, citizenId, materialType, estimatedWeightKg, estimatedValue, status, description, pickupAddress, recyclerId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, citizenId, l.material, l.weight, l.value, l.status, l.desc, l.address, l.recycler || null, now]
    );
  }

  // 4. Create Sample Completed Transaction
  console.log("💳 Creating sample transaction...");
  await db.run(`INSERT OR REPLACE INTO transactions
    (id, listingId, citizenId, recyclerId, amount, platformFee, citizenEarnings, status, paymentMethod, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["txn-001", "listing-003", citizenId, recyclerId, 126.00, 6.30, 119.70, "completed", "upi", now]
  );

  // 5. Create Sample Hotspot Report
  console.log("🚨 Creating sample hotspot report...");
  await db.run(`INSERT OR REPLACE INTO hotspots
    (id, reportedBy, photoUrl, lat, lng, addressText, severity, status, wardNumber, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["hotspot-001", citizenId, "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500", 28.6280, 77.2180, "Near Gole Market Metro Station", "high", "open", "Ward 42", now]
  );

  console.log("✅ Demo dataset seeded successfully!");
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
