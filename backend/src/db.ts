import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import crypto from "crypto";

let dbInstance: any;
let dbInitPromise: Promise<any> | null = null;

// Use a persistent relative path or a volume mount provided by the environment
const DB_PATH = process.env.DB_PATH || path.resolve("./iwis.db");

const executeInitDB = async () => {
  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  // Enable Write-Ahead Logging for concurrency
  await dbInstance.run("PRAGMA journal_mode = WAL;");
  await dbInstance.run("PRAGMA synchronous = NORMAL;");
  await dbInstance.run("PRAGMA foreign_keys = ON;");

  // ─── EXISTING TABLES (preserved) ─────────────────────────────────────────
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'citizen',
      totalCO2 REAL DEFAULT 0,
      totalScans INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      lastScanDate TEXT,
      tier TEXT DEFAULT 'Bronze',
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      userId TEXT,
      category TEXT,
      confidence INTEGER,
      co2 REAL,
      timestamp TEXT,
      imageHash TEXT,
      thumbnail TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      batchId TEXT UNIQUE,
      userId TEXT,
      status TEXT DEFAULT 'Open',
      priceRange TEXT,
      createdAt TEXT,
      FOREIGN KEY(batchId) REFERENCES batches(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bids (
      id TEXT PRIMARY KEY,
      listingId TEXT,
      recyclerId TEXT,
      offerAmount REAL,
      status TEXT DEFAULT 'Pending',
      createdAt TEXT,
      FOREIGN KEY(listingId) REFERENCES listings(id),
      FOREIGN KEY(recyclerId) REFERENCES users(id)
    );
  `);

  // Idempotently add geographic columns if they don't exist
  try { await dbInstance.run("ALTER TABLE batches ADD COLUMN lat REAL"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE batches ADD COLUMN lng REAL"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN greenPoints REAL DEFAULT 0"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN displayName TEXT"); } catch (e) {}

  // Password reset tokens table
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS reset_tokens (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  // OTP Codes table
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      phone TEXT PRIMARY KEY,
      otp TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );
  `);
  
  try { await dbInstance.run("ALTER TABLE otp_codes ADD COLUMN lastRequestedAt TEXT"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE otp_codes ADD COLUMN hourlyCount INTEGER DEFAULT 0"); } catch (e) {}

  // ─── NEW MVP TABLES ──────────────────────────────────────────────────────

  // New user columns for MVP
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN phone TEXT"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN phoneVerified INTEGER DEFAULT 0"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN address TEXT"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN city TEXT"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN state TEXT"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN pincode TEXT"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN lat REAL"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN lng REAL"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN upiId TEXT"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN totalEarnings REAL DEFAULT 0"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN preferredLanguage TEXT DEFAULT 'English'"); } catch (e) {}

  // Standalone waste listings (Sell Your Waste — not tied to scan batches)
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS waste_listings (
      id TEXT PRIMARY KEY,
      citizenId TEXT NOT NULL,
      materialType TEXT NOT NULL,
      estimatedWeightKg REAL NOT NULL,
      actualWeightKg REAL,
      photoUrl TEXT,
      description TEXT,
      pickupAddress TEXT NOT NULL,
      lat REAL,
      lng REAL,
      status TEXT DEFAULT 'listed',
      estimatedValue REAL,
      finalValue REAL,
      recyclerId TEXT,
      scheduledDate TEXT,
      scheduledTimeSlot TEXT,
      pickupPhotoUrl TEXT,
      completedAt TEXT,
      cancelledReason TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY(citizenId) REFERENCES users(id),
      FOREIGN KEY(recyclerId) REFERENCES users(id)
    );
  `);
  
  // Idempotently add wasteVolume column if it doesn't exist
  try { await dbInstance.run("ALTER TABLE waste_listings ADD COLUMN wasteVolume TEXT"); } catch (e) {}
  
  // Idempotently add thumbnail column to batches
  try { await dbInstance.run("ALTER TABLE batches ADD COLUMN thumbnail TEXT"); } catch (e) {}

  // Transactions for completed pickups
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      listingId TEXT NOT NULL,
      citizenId TEXT NOT NULL,
      recyclerId TEXT NOT NULL,
      material TEXT,
      finalWeightKg REAL,
      pricePerKg REAL,
      amount REAL NOT NULL,
      platformFee REAL NOT NULL,
      citizenEarnings REAL,
      paymentMethod TEXT DEFAULT 'cash',
      paymentStatus TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'completed',
      upiTransactionId TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(listingId) REFERENCES waste_listings(id),
      FOREIGN KEY(citizenId) REFERENCES users(id),
      FOREIGN KEY(recyclerId) REFERENCES users(id)
    );
  `);
  
  // Idempotently add new columns to transactions if they don't exist
  try { await dbInstance.run("ALTER TABLE transactions ADD COLUMN material TEXT"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE transactions ADD COLUMN finalWeightKg REAL"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE transactions ADD COLUMN pricePerKg REAL"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE transactions ADD COLUMN citizenEarnings REAL"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'completed'"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE transactions ADD COLUMN feedbackRating REAL"); } catch (e) {}
  try { await dbInstance.run("ALTER TABLE transactions ADD COLUMN feedbackComment TEXT"); } catch (e) {}

  // Recycler profiles
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS recycler_profiles (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      businessName TEXT,
      gstin TEXT,
      acceptedMaterials TEXT,
      serviceRadiusKm INTEGER DEFAULT 5,
      lat REAL,
      lng REAL,
      rating REAL DEFAULT 0,
      totalPickups INTEGER DEFAULT 0,
      isApproved INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  // Hotspot reports (illegal dump reporting)
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS hotspots (
      id TEXT PRIMARY KEY,
      reportedBy TEXT NOT NULL,
      photoUrl TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      addressText TEXT,
      severity TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      assignedTo TEXT,
      resolvedAt TEXT,
      resolutionPhotoUrl TEXT,
      wardNumber TEXT,
      ulbCode TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(reportedBy) REFERENCES users(id)
    );
  `);

  // Scrap prices by material and city
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS scrap_prices (
      id TEXT PRIMARY KEY,
      material TEXT NOT NULL,
      city TEXT NOT NULL,
      pricePerKg REAL NOT NULL,
      source TEXT DEFAULT 'manual',
      effectiveDate TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  
  // Idempotently add updatedAt column if it doesn't exist
  try { await dbInstance.run("ALTER TABLE scrap_prices ADD COLUMN updatedAt TEXT DEFAULT ''"); } catch (e) {}

  // Collection confirmations (citizen daily check)
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS collection_confirmations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      wasCollected INTEGER NOT NULL,
      wardNumber TEXT,
      ulbCode TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  // Notifications
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      isRead INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  // ─── PERFORMANCE INDEXES ───────────────────────────────────────────────────
  await dbInstance.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    
    CREATE INDEX IF NOT EXISTS idx_transactions_citizen ON transactions(citizenId);
    CREATE INDEX IF NOT EXISTS idx_transactions_recycler ON transactions(recyclerId);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
    
    CREATE INDEX IF NOT EXISTS idx_waste_listings_citizen ON waste_listings(citizenId);
    CREATE INDEX IF NOT EXISTS idx_waste_listings_recycler ON waste_listings(recyclerId);
    CREATE INDEX IF NOT EXISTS idx_waste_listings_status ON waste_listings(status);

    CREATE INDEX IF NOT EXISTS idx_recycler_profiles_user ON recycler_profiles(userId);
  `);

  // ─── SEED JAMMU PRICES (Development Only) ──────────────────────────────────
  const pricesCount = await dbInstance.get("SELECT COUNT(*) as count FROM scrap_prices");
  if (pricesCount.count === 0) {
    const jammuPrices = [
      { material: "Plastic", price: 12 },
      { material: "Cardboard", price: 6 },
      { material: "Paper", price: 10 },
      { material: "E-Waste", price: 30 },
      { material: "Glass", price: 2 },
      { material: "Metal", price: 25 },
      { material: "Organic", price: 0 },
      { material: "Mixed", price: 1 },
    ];
    
    const now = new Date().toISOString();
    
    for (const p of jammuPrices) {
      await dbInstance.run(
        `INSERT INTO scrap_prices (id, material, city, pricePerKg, source, effectiveDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), p.material, "Jammu", p.price, "system_seed", now, now, now]
      );
    }
    console.log("Seeded default scrap prices for Jammu.");
  }
  return dbInstance;
};

export const initDB = async () => {
  if (dbInstance) return dbInstance;
  if (!dbInitPromise) {
    dbInitPromise = executeInitDB();
  }
  await dbInitPromise;
  return dbInstance;
};

export const getDB = async () => {
  if (!dbInstance) {
    await initDB();
  }
  return dbInstance;
};
