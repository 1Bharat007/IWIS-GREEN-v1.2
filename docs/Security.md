# Security Model

IWIS implements defense-in-depth security across the full stack. This document covers all active security controls in v1.0.

---

## 1. Authentication

### Password Storage
- Passwords are hashed using **bcrypt** with a cost factor of 10.
- Raw passwords are never stored, logged, or transmitted after hashing.

### JWT Tokens
- Issued on successful login/signup, signed with `JWT_SECRET`.
- Tokens contain: `userId`, `role`, `email`.
- Token validation occurs in `authMiddleware` on every protected request.
- **Expiry Handling:** On HTTP 401, the frontend clears all local storage and redirects to `/login`.

### Session Management
- Stateless architecture — no server-side session store.
- Tokens are stored in `localStorage` on the client.
- Logout clears all stored tokens and user data.

---

## 2. Role-Based Access Control (RBAC)

Endpoints are partitioned by user role:

| Role | Permissions |
|------|-------------|
| `citizen` | Scan waste, create listings, view history, earn points |
| `recycler` | View geospatial feed, accept listings, schedule and complete pickups |

- The `authMiddleware` injects `req.user` into the Express request context.
- Controllers validate `req.user.role` before executing database mutations.
- Cross-role access attempts return HTTP 403.

---

## 3. Rate Limiting

IWIS uses `express-rate-limit` to prevent abuse:

| Route | Limit | Window | Purpose |
|-------|-------|--------|---------|
| `/api/auth/*` | 5 requests | 15 minutes | Prevent brute-force login |
| `/api/*` | 100 requests | 15 minutes | General API protection |

Rate limit headers are included in responses (`X-RateLimit-*`).

---

## 4. Input Validation

All incoming HTTP requests are validated using **Zod** schemas:

- Payloads failing validation are rejected with HTTP 400 and a descriptive error message.
- Validation covers: required fields, type checking, string length, enum values, email format, GPS coordinate ranges.
- Example validations: password strength, role enum (`citizen` | `recycler`), coordinate bounds.

---

## 5. SQL Injection Prevention

- All database queries use **parameterized queries** (`?` placeholders).
- No user input is ever interpolated into SQL strings.
- Example:
  ```sql
  SELECT * FROM users WHERE email = ?
  -- NOT: SELECT * FROM users WHERE email = '${email}'
  ```

---

## 6. CORS Policy

- The backend configures CORS via the `cors` middleware.
- In production, the origin whitelist is restricted to the deployed frontend URL (`FRONTEND_URL` env var).
- Credentials are allowed for JWT cookie support (future).

---

## 7. Upload Security

- The frontend compresses images client-side via Canvas API (max 1000px, WebP/JPEG, 50–70% quality).
- The backend `express.json` parser enforces a **50 MB** payload limit.
- Only Base64-encoded image strings are accepted — no direct file uploads.

---

## 8. OTP Security

- Phone verification generates a one-time password.
- **Production:** OTP is transmitted only via the configured SMS provider. The raw OTP is never logged.
- **Development:** OTP may be printed to console for testing convenience (suppressed when `NODE_ENV=production`).

---

## 9. Environment Variable Security

- All secrets (`JWT_SECRET`, `GEMINI_API_KEY`, `EMAIL_PASS`) are stored exclusively in `.env` files.
- `.env` files are excluded from version control via `.gitignore`.
- `.env.example` files contain placeholder values only — never real credentials.
- API keys are never logged, even in error messages.

---

## 10. Error Handling

- Production error responses return sanitized messages without stack traces.
- Internal errors are caught by try/catch blocks in controllers.
- The AI router suppresses raw Gemini API error details from client responses.

---

## Recommendations for Production Hardening

These items are planned for future releases:

1. **HTTPS:** Enforce TLS in production (handled by Render/Vercel).
2. **Helmet.js:** Add HTTP security headers (CSP, HSTS, X-Frame-Options).
3. **Token Refresh:** Implement refresh token rotation to reduce JWT lifetime.
4. **CSRF Protection:** Add CSRF tokens for state-changing operations.
5. **Audit Logging:** Log authentication events and admin actions.
6. **Dependency Scanning:** Automated `npm audit` in CI pipeline.
