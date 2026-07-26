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

  let migrationFailed = false;

  const runMigration = async (sql: string, columnName: string) => {
    try {
      await dbInstance.run(sql);
      console.log(`[db] Applied migration for ${columnName}`);
    } catch (e: any) {
      const msg = String(e?.message || e).toLowerCase();
      if (msg.includes("duplicate column name") || msg.includes("already exists")) {
        console.log(`[db] ${columnName} column already present`);
      } else {
        console.error(`[db] MIGRATION FAILED for ${columnName} column:`, e);
        migrationFailed = true;
      }
    }
  };

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
    CREATE INDEX IF NOT EXISTS idx_batches_user_time ON batches(userId, timestamp);
    CREATE INDEX IF NOT EXISTS idx_batches_category ON batches(category);

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

    CREATE TABLE IF NOT EXISTS ai_telemetry (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      userId TEXT,
      aiVersion TEXT,
      model TEXT,
      latencyMs INTEGER,
      status TEXT,
      retryCount INTEGER,
      validationFailed INTEGER DEFAULT 0,
      normalizationCorrected INTEGER DEFAULT 0,
      material TEXT,
      confidence INTEGER,
      errorCode TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON ai_telemetry(timestamp);
    CREATE INDEX IF NOT EXISTS idx_telemetry_status ON ai_telemetry(status);
    CREATE INDEX IF NOT EXISTS idx_telemetry_material ON ai_telemetry(material);
    CREATE INDEX IF NOT EXISTS idx_telemetry_aiVersion ON ai_telemetry(aiVersion);

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
  await runMigration("ALTER TABLE batches ADD COLUMN lat REAL", "batches.lat");
  await runMigration("ALTER TABLE batches ADD COLUMN lng REAL", "batches.lng");
  await runMigration("ALTER TABLE users ADD COLUMN greenPoints REAL DEFAULT 0", "users.greenPoints");
  await runMigration("ALTER TABLE users ADD COLUMN displayName TEXT", "users.displayName");

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
  
  await runMigration("ALTER TABLE otp_codes ADD COLUMN lastRequestedAt TEXT", "otp_codes.lastRequestedAt");
  await runMigration("ALTER TABLE otp_codes ADD COLUMN hourlyCount INTEGER DEFAULT 0", "otp_codes.hourlyCount");
  await runMigration("ALTER TABLE otp_codes ADD COLUMN attempts INTEGER DEFAULT 0", "otp_codes.attempts");

  // ─── NEW MVP TABLES ──────────────────────────────────────────────────────

  // New user columns for MVP
  await runMigration("ALTER TABLE users ADD COLUMN phone TEXT", "users.phone");
  await runMigration("ALTER TABLE users ADD COLUMN phoneVerified INTEGER DEFAULT 0", "users.phoneVerified");
  await runMigration("ALTER TABLE users ADD COLUMN address TEXT", "users.address");
  await runMigration("ALTER TABLE users ADD COLUMN city TEXT", "users.city");
  await runMigration("ALTER TABLE users ADD COLUMN state TEXT", "users.state");
  await runMigration("ALTER TABLE users ADD COLUMN pincode TEXT", "users.pincode");
  await runMigration("ALTER TABLE users ADD COLUMN lat REAL", "users.lat");
  await runMigration("ALTER TABLE users ADD COLUMN lng REAL", "users.lng");
  await runMigration("ALTER TABLE users ADD COLUMN upiId TEXT", "users.upiId");
  await runMigration("ALTER TABLE users ADD COLUMN totalEarnings REAL DEFAULT 0", "users.totalEarnings");
  await runMigration("ALTER TABLE users ADD COLUMN preferredLanguage TEXT DEFAULT 'English'", "users.preferredLanguage");
  await runMigration("ALTER TABLE users ADD COLUMN clerkId TEXT", "clerkId");

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
    CREATE INDEX IF NOT EXISTS idx_waste_listings_status ON waste_listings(status);
    CREATE INDEX IF NOT EXISTS idx_waste_listings_recyclerId ON waste_listings(recyclerId);
  `);
  
  await runMigration("ALTER TABLE waste_listings ADD COLUMN wasteVolume TEXT", "waste_listings.wasteVolume");
  await runMigration("ALTER TABLE batches ADD COLUMN thumbnail TEXT", "batches.thumbnail");

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
  
  await runMigration("ALTER TABLE transactions ADD COLUMN material TEXT", "transactions.material");
  await runMigration("ALTER TABLE transactions ADD COLUMN finalWeightKg REAL", "transactions.finalWeightKg");
  await runMigration("ALTER TABLE transactions ADD COLUMN pricePerKg REAL", "transactions.pricePerKg");
  await runMigration("ALTER TABLE transactions ADD COLUMN citizenEarnings REAL", "transactions.citizenEarnings");
  await runMigration("ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'completed'", "transactions.status");
  await runMigration("ALTER TABLE transactions ADD COLUMN feedbackRating REAL", "transactions.feedbackRating");
  await runMigration("ALTER TABLE transactions ADD COLUMN feedbackComment TEXT", "transactions.feedbackComment");

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
  
  await runMigration("ALTER TABLE scrap_prices ADD COLUMN updatedAt TEXT DEFAULT ''", "scrap_prices.updatedAt");

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

  // ─── SPRINT 2 MIGRATIONS (Batches Normalization) ───────────────────────────
  await runMigration("ALTER TABLE batches ADD COLUMN subCategory TEXT", "batches.subCategory");
  await runMigration("ALTER TABLE batches ADD COLUMN recyclability TEXT", "batches.recyclability");
  await runMigration("ALTER TABLE batches ADD COLUMN marketDemand TEXT", "batches.marketDemand");
  await runMigration("ALTER TABLE batches ADD COLUMN estimatedWeight REAL", "batches.estimatedWeight");
  await runMigration("ALTER TABLE batches ADD COLUMN estimatedPricePerKg REAL", "batches.estimatedPricePerKg");
  await runMigration("ALTER TABLE batches ADD COLUMN aiVersion TEXT", "batches.aiVersion");
  await runMigration("ALTER TABLE batches ADD COLUMN processingTimeMs INTEGER", "batches.processingTimeMs");
  await runMigration("ALTER TABLE batches ADD COLUMN validationStatus TEXT", "batches.validationStatus");
  await runMigration("ALTER TABLE batches ADD COLUMN normalizationStatus TEXT", "batches.normalizationStatus");
  await runMigration("ALTER TABLE batches ADD COLUMN narrativeMetadata TEXT", "batches.narrativeMetadata");

  // Fail loud if any migration unexpectedly failed
  if (migrationFailed) {
    throw new Error("[db] Database initialization failed due to schema migration errors.");
  }

  // ─── PERFORMANCE INDEXES ───────────────────────────────────────────────────
  await dbInstance.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerkId ON users(clerkId);
    
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
