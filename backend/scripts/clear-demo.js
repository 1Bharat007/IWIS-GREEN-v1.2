"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
const path_1 = __importDefault(require("path"));
// Execute from backend root using `npx ts-node scripts/clear-demo.ts`
async function clearDemo() {
    console.log("🧹 Clearing demo dataset...");
    process.env.DB_PATH = path_1.default.resolve("./iwis.db");
    const db = await (0, db_1.getDB)();
    const citizenId = "demo-citizen-001";
    const recyclerId = "demo-recycler-001";
    await db.run(`DELETE FROM notifications WHERE userId = ?`, [citizenId]);
    await db.run(`DELETE FROM transactions WHERE citizenId = ? OR recyclerId = ?`, [citizenId, recyclerId]);
    await db.run(`DELETE FROM waste_listings WHERE citizenId = ? OR recyclerId = ?`, [citizenId, recyclerId]);
    await db.run(`DELETE FROM batches WHERE userId = ?`, [citizenId]);
    await db.run(`DELETE FROM recycler_profiles WHERE userId = ?`, [recyclerId]);
    await db.run(`DELETE FROM users WHERE id IN (?, ?)`, [citizenId, recyclerId]);
    console.log("✅ Demo dataset cleared successfully!");
}
clearDemo().catch(console.error);
