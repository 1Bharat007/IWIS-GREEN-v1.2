# API Reference

The IWIS Backend is a RESTful Express.js API running by default on `http://localhost:5000/api`.

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication (`/api/auth`)

### `POST /login`
Authenticates a user and returns a JWT.
- **Body:** `{ "email": "user@example.com", "password": "password123" }`
- **Response:** `{ "token": "eyJ...", "user": { "id": "...", "role": "citizen" } }`

### `POST /signup`
Registers a new user (Citizen or Recycler).
- **Body:** `{ "email": "...", "password": "...", "role": "citizen", "phone": "...", "displayName": "..." }`
- **Response:** `{ "message": "User created", "token": "..." }`

### `POST /forgot-password`
Initiates the password reset flow via Gmail SMTP.
- **Body:** `{ "email": "user@example.com" }`

---

## 2. Waste Management (`/api/waste`)

### `POST /scan`
**[Protected]** Uploads a base64 image to the Gemini Vision AI for waste classification.
- **Body:** `{ "image": "data:image/jpeg;base64,...", "thumbnail": "data:image/webp;base64,..." }`
- **Response:** 
```json
{
  "batchId": "uuid",
  "aiAnalysis": {
    "materialType": "PET Plastic",
    "confidence": 98,
    "estimatedWeightKg": 2.5
  },
  "estimatedValue": 35.00
}
```

### `GET /history`
**[Protected]** Retrieves the authenticated citizen's previous scans.
- **Query:** `?limit=5`
- **Response:** Array of recent batches with thumbnails and AI analysis.

---

## 3. Listings (`/api/listings`)

### `POST /`
**[Protected: Citizen]** Creates a marketplace listing for recyclers to claim.
- **Body:** `{ "batchId": "uuid", "pickupAddress": "...", "latitude": 32.7, "longitude": 74.8, "description": "..." }`

### `GET /`
**[Protected: Recycler]** Retrieves active listings. Supports geospatial queries.
- **Query:** `?lat=32.7&lng=74.8` (Calculates Haversine distance).

### `POST /:id/accept`
**[Protected: Recycler]** Claims a listing.
- **Response:** Marks listing `status = 'accepted'` and assigns `recyclerId`.

### `POST /:id/schedule`
**[Protected: Recycler]** Sets a collection date.
- **Body:** `{ "scheduledDate": "2026-06-30", "scheduledTimeSlot": "Morning" }`

### `POST /:id/confirm`
**[Protected: Recycler]** Finalizes the collection and issues payouts.
- **Body:** `{ "actualWeightKg": 3.2 }`

---

## 4. Users (`/api/users`)

### `GET /me`
**[Protected]** Returns the current authenticated user's profile, total earnings, and green points.

### `GET /dashboard`
**[Protected: Citizen]** Returns aggregated dashboard statistics (CO2 saved, points, recent activity).

---

## 5. Notifications (`/api/notifications`)

### `GET /`
**[Protected]** Retrieves the user's unread notifications.

### `POST /:id/read`
**[Protected]** Marks a specific notification as read.
