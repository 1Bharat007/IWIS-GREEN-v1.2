# Security Model

The IWIS platform takes security seriously. Below is an overview of the security implementations active in v1.0.

## 1. Authentication (JWT)
IWIS utilizes JSON Web Tokens (JWT) for stateless authentication.
- **Hashing:** User passwords are encrypted at rest using `bcrypt` (Cost Factor: 10).
- **Issuance:** Tokens are issued upon successful login or signup and signed using the `JWT_SECRET`.
- **Expiration:** Tokens inherently expire. On HTTP 401, the frontend intercepts the response, aggressively clears the local storage, and kicks the user to `/login` to prevent stale sessions.

## 2. Role-Based Access Control (RBAC)
Endpoints are heavily partitioned by user role:
- **`citizen`:** Can scan waste, create listings, and view personal history.
- **`recycler`:** Can view the geospatial feed, accept listings, and log physical collections.
- The `authMiddleware` injects `req.user` into the request context. Controllers strictly validate `req.user.role` before executing database mutations.

## 3. Rate Limiting (DDoS Protection)
We use `express-rate-limit` to prevent abuse.
- **Auth Routes (`/api/auth/*`):** Restricted to 5 requests per 15 minutes to prevent password brute-forcing.
- **General API (`/api/*`):** Restricted to 100 requests per 15 minutes per IP.

## 4. Input Validation
All incoming HTTP requests are validated via **Zod**.
- Payloads that fail strict schema validation are rejected with HTTP 400 immediately, protecting the SQLite database from SQL Injection and malformed data crashes.
- Example: Password strength checks, required GPS coordinates, and role enum validation.

## 5. OTP (One-Time Password)
- Phone verification is stubbed out for the MVP. However, the architecture handles OTP issuance.
- **Security Check:** In production (`NODE_ENV === "production"`), the raw OTP is **never** printed to standard output or logs. It is securely transmitted to the third-party SMS provider.

## 6. Secure Uploads
- The frontend prevents massive payload uploads via Canvas compression (forcing maximum dimensions and converting to WebP/JPEG).
- The backend `express.json` parser restricts incoming payloads to `50mb` as a hard cap.
