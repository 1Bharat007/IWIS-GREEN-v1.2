# Known Limitations

We believe in complete transparency. As IWIS v1.0 was rapidly architected to support the Jammu pilot, certain technical shortcuts were taken to ensure maximum velocity and minimal infrastructure overhead.

### 1. SQLite for MVP
- **Limitation:** The backend uses a local iwis.db SQLite file.
- **Why:** Zero-setup infrastructure.
- **Impact:** It cannot scale horizontally across multiple backend instances (e.g. Serverless/Lambda). A future migration to PostgreSQL is required for multi-city scaling.

### 2. Base64 Image Storage
- **Limitation:** We store lightweight WebP thumbnails (~20-40kb) directly in the SQLite atches table as Base64 strings.
- **Why:** Avoids configuring AWS S3 or Cloudinary buckets for the initial open-source release.
- **Impact:** Over time, the database file will bloat. The frontend compressImage utility heavily mitigates this.

### 3. Mock OTP System
- **Limitation:** The phone verification system generates an OTP but only logs it to the terminal.
- **Why:** Saves API costs (Twilio/MSG91) during open-source distribution.
- **Impact:** Production instances must uncomment and configure the SMS provider block in uth.controller.ts.

### 4. No Offline Push Sync
- **Limitation:** The app gracefully handles offline network errors but does *not* queue requests via IndexedDB for later background sync.
- **Impact:** Users must have active 3G/4G/WiFi to complete a scan or accept a listing.

### 5. Haversine Distance Limitations
- **Limitation:** The Recycler feed calculates straight-line (Haversine) distance in SQL.
- **Impact:** It does not account for actual road networks or driving time (e.g., Google Maps Distance Matrix).
