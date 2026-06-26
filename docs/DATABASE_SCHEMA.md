# Database Schema

IWIS MVP relies on a local SQLite database (iwis.db). The schema is designed to be fully relational and portable to PostgreSQL in v2.

## Core Tables

### users
Stores all platform users (Citizens and Recyclers).
- id (TEXT, PK): UUID
- email (TEXT, UNIQUE)
- password (TEXT): Bcrypt hashed
- ole (TEXT): 'citizen' | 'recycler'
- phone (TEXT)
- displayName (TEXT)
- preferredLanguage (TEXT): 'en' | 'hi'
- 	otalCO2Saved (REAL): Aggregated metric
- greenPoints (INTEGER): Gamification score
- createdAt (DATETIME)

### scrap_prices
Localized dynamic pricing engine.
- id (TEXT, PK)
- materialType (TEXT): e.g. 'PET Plastic'
- pricePerKg (REAL)
- egion (TEXT): e.g. 'Jammu'
- updatedAt (DATETIME)

### atches
Represents an AI scan session.
- id (TEXT, PK): UUID
- citizenId (TEXT, FK): -> users.id
- imagePath (TEXT)
- 	humbnail (TEXT): Base64 WebP
- iAnalysis (TEXT): JSON dump of Gemini Vision output
- materialType (TEXT): Parsed from AI
- estimatedWeightKg (REAL)
- confidenceScore (REAL)
- createdAt (DATETIME)

### listings
Marketplace items posted by citizens.
- id (TEXT, PK)
- atchId (TEXT, FK): -> batches.id
- citizenId (TEXT, FK): -> users.id
- ecyclerId (TEXT, FK): -> users.id (Nullable, assigned upon acceptance)
- status (TEXT): 'active' | 'accepted' | 'completed' | 'cancelled'
- pickupAddress (TEXT)
- latitude, longitude (REAL): For geospatial feeds
- scheduledDate, scheduledTimeSlot (TEXT)
- ctualWeightKg (REAL): Filled by Recycler at collection
- inalPayout (REAL)
- createdAt, updatedAt (DATETIME)

### 	ransactions
Immutable ledger of completed collections.
- id (TEXT, PK)
- listingId (TEXT, FK): -> listings.id
- citizenId (TEXT, FK): -> users.id
- ecyclerId (TEXT, FK): -> users.id
- mount (REAL)
- createdAt (DATETIME)

### 
otifications
System alerts for users.
- id (TEXT, PK)
- userId (TEXT, FK): -> users.id
- 	itle, message (TEXT)
- isRead (INTEGER): 0 | 1
- createdAt (DATETIME)

## Indexes
- idx_listings_status_location: Speeds up recycler feed distance queries.
- idx_batches_citizenId: Speeds up citizen scan history.
