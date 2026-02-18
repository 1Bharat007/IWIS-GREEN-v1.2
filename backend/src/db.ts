import sqlite3 from "sqlite3";
import { open } from "sqlite";

let dbInstance: any;

export const initDB = async () => {
  dbInstance = await open({
    filename: "./iwis.db",
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
  `);

  return dbInstance;
};

export const getDB = async () => {
  if (!dbInstance) {
    await initDB();
  }
  return dbInstance;
};
