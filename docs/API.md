# API Reference

The IWIS backend is a RESTful Express.js API. All endpoints are prefixed with `/api`.

**Base URL:** `http://localhost:5000/api` (development) or your Render deployment URL.

**Authentication:** Protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## Table of Contents

- [Authentication](#1-authentication)
- [Waste Management](#2-waste-management)
- [Listings](#3-listings)
- [Recycler](#4-recycler)
- [Users](#5-users)
- [Notifications](#6-notifications)
- [Transactions](#7-transactions)
- [Marketplace](#8-marketplace)
- [Prices](#9-prices)
- [Chat (EcoBot)](#10-chat-ecobot)
- [Error Handling](#error-handling)

---

## 1. Authentication

### `POST /api/auth/signup`

Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "citizen",
  "phone": "+91-9876543210",
  "displayName": "Priya Sharma"
}
```

**Response (201):**
```json
{
  "message": "User created",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "uuid", "email": "user@example.com", "role": "citizen" }
}
```

### `POST /api/auth/login`

Authenticate and receive a JWT.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "uuid", "email": "user@example.com", "role": "citizen", "displayName": "Priya" }
}
```

### `POST /api/auth/forgot-password`

Initiate password reset via email.

**Body:**
```json
{ "email": "user@example.com" }
```

### `POST /api/auth/reset-password`

Reset password using the token from the email link.

**Body:**
```json
{ "token": "reset-token", "newPassword": "newSecurePassword456" }
```

---

## 2. Waste Management

### `POST /api/waste/scan` 🔒

Upload an image for AI waste classification.

**Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "thumbnail": "data:image/webp;base64,UklGRi..."
}
```

**Response (200):**
```json
{
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "aiAnalysis": {
    "materialType": "PET Plastic",
    "confidence": 98,
    "estimatedWeightKg": 2.5
  },
  "estimatedValue": 35.00
}
```

### `GET /api/waste/history` 🔒

Retrieve the authenticated citizen's scan history.

**Query:** `?limit=10`

**Response (200):**
```json
[
  {
    "batchId": "uuid",
    "materialType": "PET Plastic",
    "confidence": 98,
    "estimatedWeightKg": 2.5,
    "thumbnail": "data:image/webp;base64,...",
    "createdAt": "2026-06-25T10:30:00Z"
  }
]
```

---

## 3. Listings

### `POST /api/listings` 🔒 (Citizen)

Create a marketplace listing from a scan batch.

**Body:**
```json
{
  "batchId": "uuid",
  "pickupAddress": "123 Gandhi Nagar, Jammu",
  "latitude": 32.7266,
  "longitude": 74.8570,
  "description": "5 PET bottles, clean and dry"
}
```

### `GET /api/listings` 🔒 (Recycler)

Retrieve active listings, optionally sorted by distance.

**Query:** `?lat=32.7266&lng=74.8570`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "materialType": "PET Plastic",
    "estimatedWeightKg": 2.5,
    "estimatedValue": 35.00,
    "pickupAddress": "123 Gandhi Nagar, Jammu",
    "distance_km": 1.3,
    "status": "active",
    "createdAt": "2026-06-25T10:30:00Z"
  }
]
```

### `POST /api/listings/:id/accept` 🔒 (Recycler)

Claim a listing. Sets `status = 'accepted'` and assigns the recycler.

### `POST /api/listings/:id/schedule` 🔒 (Recycler)

Schedule a collection time.

**Body:**
```json
{
  "scheduledDate": "2026-06-30",
  "scheduledTimeSlot": "Morning"
}
```

### `POST /api/listings/:id/confirm` 🔒 (Recycler)

Finalize collection with actual weight. Creates a transaction and issues payout.

**Body:**
```json
{ "actualWeightKg": 3.2 }
```

---

## 4. Recycler

### `GET /api/recycler/active` 🔒 (Recycler)

Get the recycler's currently accepted (in-progress) listings.

---

## 5. Users

### `GET /api/users/me` 🔒

Returns the authenticated user's profile, total earnings, and green points.

### `GET /api/users/dashboard` 🔒 (Citizen)

Aggregated dashboard statistics: CO₂ saved, points, recent activity, tier progress.

---

## 6. Notifications

### `GET /api/notifications` 🔒

Retrieve the user's notifications (newest first).

### `POST /api/notifications/:id/read` 🔒

Mark a specific notification as read.

---

## 7. Transactions

### `GET /api/transactions` 🔒

Retrieve the user's transaction history (earnings for citizens, payouts for recyclers).

### `GET /api/transactions/stats` 🔒

Aggregated transaction statistics for charts and analytics.

---

## 8. Marketplace

### `GET /api/marketplace` 🔒

Browse the public marketplace feed. Returns active listings available for recyclers.

---

## 9. Prices

### `GET /api/prices`

Retrieve current scrap prices by material type and region.

**Query:** `?region=Jammu`

---

## 10. Chat (EcoBot)

### `POST /api/chat` 🔒

Send a message to the EcoBot AI assistant.

**Body:**
```json
{
  "message": "Can I recycle Tetra Pak cartons?",
  "history": []
}
```

**Response (200):**
```json
{
  "reply": "Yes! Tetra Pak cartons are recyclable. They contain layers of paper, plastic, and aluminum..."
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request — validation failed (Zod) |
| 401 | Unauthorized — missing or invalid JWT |
| 403 | Forbidden — insufficient role permissions |
| 404 | Not Found — resource does not exist |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |

🔒 = Requires `Authorization: Bearer <token>` header
