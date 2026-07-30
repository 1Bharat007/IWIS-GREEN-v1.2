-- ============================================================
-- IWIS Postgres Schema
-- Faithful port of backend/src/db.ts — additive stage only
-- Rule: INTEGER booleans stay INTEGER (not BOOLEAN) because
--       controller code uses === 0 / === 1 comparisons.
-- Rule: REAL becomes DOUBLE PRECISION.
-- Rule: No new FK/NOT NULL constraints added vs. SQLite source.
-- ============================================================

-- ─── users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,
  email             TEXT UNIQUE,
  password          TEXT,
  role              TEXT DEFAULT 'citizen',
  totalCO2          DOUBLE PRECISION DEFAULT 0,
  totalScans        INTEGER DEFAULT 0,
  streak            INTEGER DEFAULT 0,
  lastScanDate      TEXT,
  tier              TEXT DEFAULT 'Bronze',
  createdAt         TEXT,
  -- runMigration additions:
  greenPoints       DOUBLE PRECISION DEFAULT 0,
  displayName       TEXT,
  phone             TEXT,
  phoneVerified     INTEGER DEFAULT 0,   -- kept INTEGER, not BOOLEAN (=== 0/1 in controllers)
  address           TEXT,
  city              TEXT,
  state             TEXT,
  pincode           TEXT,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  upiId             TEXT,
  totalEarnings     DOUBLE PRECISION DEFAULT 0,
  preferredLanguage TEXT DEFAULT 'English',
  clerkId           TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users(role);
-- NOTE: SQLite source uses CREATE UNIQUE INDEX; preserved here.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerkId ON users(clerkId);

-- ─── batches ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS batches (
  id                  TEXT PRIMARY KEY,
  userId              TEXT,
  category            TEXT,
  confidence          INTEGER,
  co2                 DOUBLE PRECISION,
  timestamp           TEXT,
  imageHash           TEXT,
  thumbnail           TEXT,
  -- runMigration additions:
  lat                 DOUBLE PRECISION,
  lng                 DOUBLE PRECISION,
  subCategory         TEXT,
  recyclability       TEXT,
  marketDemand        TEXT,
  estimatedWeight     DOUBLE PRECISION,
  estimatedPricePerKg DOUBLE PRECISION,
  aiVersion           TEXT,
  processingTimeMs    INTEGER,
  validationStatus    TEXT,
  normalizationStatus TEXT,
  narrativeMetadata   TEXT,
  FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_batches_user_time ON batches(userId, timestamp);
CREATE INDEX IF NOT EXISTS idx_batches_category  ON batches(category);

-- ─── listings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id         TEXT PRIMARY KEY,
  batchId    TEXT UNIQUE,
  userId     TEXT,
  status     TEXT DEFAULT 'Open',
  priceRange TEXT,
  createdAt  TEXT,
  FOREIGN KEY(batchId) REFERENCES batches(id),
  FOREIGN KEY(userId)  REFERENCES users(id)
);

-- ─── ai_telemetry ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_telemetry (
  id                      TEXT PRIMARY KEY,
  timestamp               TEXT,
  userId                  TEXT,
  aiVersion               TEXT,
  model                   TEXT,
  latencyMs               INTEGER,
  status                  TEXT,
  retryCount              INTEGER,
  validationFailed        INTEGER DEFAULT 0,   -- INTEGER, not BOOLEAN
  normalizationCorrected  INTEGER DEFAULT 0,   -- INTEGER, not BOOLEAN
  material                TEXT,
  confidence              INTEGER,
  errorCode               TEXT
);

CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON ai_telemetry(timestamp);
CREATE INDEX IF NOT EXISTS idx_telemetry_status    ON ai_telemetry(status);
CREATE INDEX IF NOT EXISTS idx_telemetry_material  ON ai_telemetry(material);
CREATE INDEX IF NOT EXISTS idx_telemetry_aiVersion ON ai_telemetry(aiVersion);

-- ─── bids ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bids (
  id          TEXT PRIMARY KEY,
  listingId   TEXT,
  recyclerId  TEXT,
  offerAmount DOUBLE PRECISION,
  status      TEXT DEFAULT 'Pending',
  createdAt   TEXT,
  FOREIGN KEY(listingId)  REFERENCES listings(id),
  FOREIGN KEY(recyclerId) REFERENCES users(id)
);

-- ─── reset_tokens ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reset_tokens (
  token     TEXT PRIMARY KEY,
  userId    TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
);

-- ─── otp_codes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  phone           TEXT PRIMARY KEY,
  otp             TEXT NOT NULL,
  expiresAt       TEXT NOT NULL,
  -- runMigration additions:
  lastRequestedAt TEXT,
  hourlyCount     INTEGER DEFAULT 0,
  attempts        INTEGER DEFAULT 0
);

-- ─── waste_listings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waste_listings (
  id                TEXT PRIMARY KEY,
  citizenId         TEXT NOT NULL,
  materialType      TEXT NOT NULL,
  estimatedWeightKg DOUBLE PRECISION NOT NULL,
  actualWeightKg    DOUBLE PRECISION,
  photoUrl          TEXT,
  description       TEXT,
  pickupAddress     TEXT NOT NULL,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  status            TEXT DEFAULT 'listed',
  estimatedValue    DOUBLE PRECISION,
  finalValue        DOUBLE PRECISION,
  recyclerId        TEXT,
  scheduledDate     TEXT,
  scheduledTimeSlot TEXT,
  pickupPhotoUrl    TEXT,
  completedAt       TEXT,
  cancelledReason   TEXT,
  createdAt         TEXT NOT NULL,
  updatedAt         TEXT,
  -- runMigration addition:
  wasteVolume       TEXT,
  FOREIGN KEY(citizenId)  REFERENCES users(id),
  FOREIGN KEY(recyclerId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_waste_listings_status     ON waste_listings(status);
CREATE INDEX IF NOT EXISTS idx_waste_listings_recyclerId ON waste_listings(recyclerId);
CREATE INDEX IF NOT EXISTS idx_waste_listings_citizen    ON waste_listings(citizenId);
CREATE INDEX IF NOT EXISTS idx_waste_listings_recycler   ON waste_listings(recyclerId);
-- NOTE: idx_waste_listings_recyclerId and idx_waste_listings_recycler both exist
-- in db.ts (one in the exec block, one in the performance indexes block).
-- Postgres will reject a true duplicate index name, so the second CREATE INDEX IF NOT EXISTS
-- on the same column(s) is a no-op — safe to include both name definitions here,
-- as IF NOT EXISTS prevents the error.

-- ─── transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id               TEXT PRIMARY KEY,
  listingId        TEXT NOT NULL,
  citizenId        TEXT NOT NULL,
  recyclerId       TEXT NOT NULL,
  material         TEXT,
  finalWeightKg    DOUBLE PRECISION,
  pricePerKg       DOUBLE PRECISION,
  amount           DOUBLE PRECISION NOT NULL,
  platformFee      DOUBLE PRECISION NOT NULL,
  citizenEarnings  DOUBLE PRECISION,
  paymentMethod    TEXT DEFAULT 'cash',
  paymentStatus    TEXT DEFAULT 'pending',
  status           TEXT DEFAULT 'completed',
  upiTransactionId TEXT,
  createdAt        TEXT NOT NULL,
  -- runMigration additions (already in column list above as they overlap; listed for audit):
  -- material, finalWeightKg, pricePerKg, citizenEarnings, status already included above
  feedbackRating   DOUBLE PRECISION,
  feedbackComment  TEXT,
  FOREIGN KEY(listingId)  REFERENCES waste_listings(id),
  FOREIGN KEY(citizenId)  REFERENCES users(id),
  FOREIGN KEY(recyclerId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_citizen  ON transactions(citizenId);
CREATE INDEX IF NOT EXISTS idx_transactions_recycler ON transactions(recyclerId);
CREATE INDEX IF NOT EXISTS idx_transactions_status   ON transactions(status);

-- ─── recycler_profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recycler_profiles (
  id                TEXT PRIMARY KEY,
  userId            TEXT UNIQUE NOT NULL,
  businessName      TEXT,
  gstin             TEXT,
  acceptedMaterials TEXT,
  serviceRadiusKm   INTEGER DEFAULT 5,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  rating            DOUBLE PRECISION DEFAULT 0,
  totalPickups      INTEGER DEFAULT 0,
  isApproved        INTEGER DEFAULT 0,   -- INTEGER, not BOOLEAN (=== 0/1 in controllers)
  createdAt         TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_recycler_profiles_user ON recycler_profiles(userId);

-- ─── hotspots ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotspots (
  id                 TEXT PRIMARY KEY,
  reportedBy         TEXT NOT NULL,
  photoUrl           TEXT NOT NULL,
  lat                DOUBLE PRECISION NOT NULL,
  lng                DOUBLE PRECISION NOT NULL,
  addressText        TEXT,
  severity           TEXT DEFAULT 'medium',
  status             TEXT DEFAULT 'open',
  assignedTo         TEXT,
  resolvedAt         TEXT,
  resolutionPhotoUrl TEXT,
  wardNumber         TEXT,
  ulbCode            TEXT,
  createdAt          TEXT NOT NULL,
  FOREIGN KEY(reportedBy) REFERENCES users(id)
);

-- ─── scrap_prices ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrap_prices (
  id            TEXT PRIMARY KEY,
  material      TEXT NOT NULL,
  city          TEXT NOT NULL,
  pricePerKg    DOUBLE PRECISION NOT NULL,
  source        TEXT DEFAULT 'manual',
  effectiveDate TEXT NOT NULL,
  createdAt     TEXT NOT NULL,
  updatedAt     TEXT NOT NULL
);

-- ─── collection_confirmations ────────────────────────────────
CREATE TABLE IF NOT EXISTS collection_confirmations (
  id           TEXT PRIMARY KEY,
  userId       TEXT NOT NULL,
  date         TEXT NOT NULL,
  wasCollected INTEGER NOT NULL,   -- INTEGER, not BOOLEAN
  wardNumber   TEXT,
  ulbCode      TEXT,
  createdAt    TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
);

-- ─── notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL,
  title     TEXT NOT NULL,
  message   TEXT NOT NULL,
  type      TEXT DEFAULT 'info',
  isRead    INTEGER DEFAULT 0,   -- INTEGER, not BOOLEAN
  createdAt TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);

-- ============================================================
-- Schema Improvement Opportunities (NOT applied — faithful port only)
-- ============================================================
-- 1. users.email, batches.userId, listings.userId, bids.listingId,
--    waste_listings.citizenId etc. have FOREIGN KEY constraints in SQLite
--    but SQLite does not enforce FK integrity by default (it requires
--    PRAGMA foreign_keys = ON per connection). Postgres enforces FK
--    constraints always. The schema here ports them faithfully; however,
--    orphaned rows that may exist in the SQLite data would fail import.
--    Recommendation: add ON DELETE CASCADE / ON DELETE SET NULL where
--    appropriate once data is audited.
-- 2. Several TEXT columns storing ISO timestamps (createdAt, updatedAt,
--    expiresAt) could be TIMESTAMPTZ for proper timezone handling and
--    range queries. Currently kept TEXT per the faithful-port rule.
-- 3. isApproved, phoneVerified, wasCollected, isRead, validationFailed,
--    normalizationCorrected are semantically boolean. Stored as INTEGER
--    per spec. When controllers are migrated, consider converting to
--    BOOLEAN with explicit CAST in queries.
-- 4. waste_listings has two indexes on (recyclerId): idx_waste_listings_recyclerId
--    and idx_waste_listings_recycler — both appear in db.ts. They are
--    identical in effect. One should be removed during cleanup.
-- ============================================================
