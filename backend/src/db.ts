import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

let dbInstance: any;

// Use /tmp on production servers (Render, Railway, etc.), local path in dev
const DB_PATH = process.env.NODE_ENV === "production"
  ? "/tmp/iwis.db"
  : path.resolve("./iwis.db");

export const initDB = async () => {
  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

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
  // Idempotently add Green Points Wallet column
  try { await dbInstance.run("ALTER TABLE users ADD COLUMN greenPoints REAL DEFAULT 0"); } catch (e) {}

  // Password reset tokens table
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS reset_tokens (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);


  return dbInstance;
};

export const getDB = async () => {
  if (!dbInstance) {
    await initDB();
  }
  return dbInstance;
};
