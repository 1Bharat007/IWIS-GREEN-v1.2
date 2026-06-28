# Known Limitations

We believe in complete transparency. IWIS v1.0 was designed for rapid deployment to support the Jammu pilot. The following technical limitations are documented and planned for resolution.

---

### 1. SQLite for MVP

- **Limitation:** The backend uses a local `iwis.db` SQLite file for all persistent storage.
- **Why:** Zero-setup infrastructure. No external database service required.
- **Impact:** Cannot scale horizontally across multiple backend instances. Data is lost on ephemeral hosting (Render free tier) when the service restarts.
- **Planned Fix:** PostgreSQL migration in v1.1 (Supabase or Neon).

### 2. Base64 Image Storage

- **Limitation:** Compressed WebP thumbnails (~20–40 KB) are stored as Base64 strings directly in the `batches` table.
- **Why:** Avoids configuring cloud storage (S3, Cloudinary) for the initial release.
- **Impact:** Database file grows over time. Mitigated by aggressive client-side compression.
- **Planned Fix:** Cloud storage migration in v1.2.

### 3. Mock OTP System

- **Limitation:** Phone verification generates an OTP but only logs it to the console (development mode).
- **Why:** Avoids SMS provider costs (Twilio, MSG91) during open-source distribution.
- **Impact:** Production deployments must integrate a real SMS provider.
- **Planned Fix:** SMS integration in v1.2.

### 4. No Offline Sync

- **Limitation:** The app shows error states when offline but does not queue requests for background sync.
- **Impact:** Users need active 3G/4G/WiFi connectivity for all operations.
- **Planned Fix:** Service worker with IndexedDB queue in v1.1.

### 5. Haversine Distance Only

- **Limitation:** The recycler feed calculates straight-line (great-circle) distance.
- **Impact:** Does not account for actual road networks, traffic, or driving time.
- **Planned Fix:** Google Maps Distance Matrix or PostGIS routing in v2.0.

### 6. Single-Region Pricing

- **Limitation:** Scrap prices are seeded only for the Jammu region.
- **Impact:** Other cities require manual data entry into the `scrap_prices` table.
- **Planned Fix:** Admin dashboard for price management in v2.0.

### 7. No Real-Time Updates

- **Limitation:** The frontend polls for notifications and feed updates on page load rather than receiving live pushes.
- **Impact:** Users must refresh to see new listings or status changes.
- **Planned Fix:** WebSocket (Socket.io) integration in v2.0.
