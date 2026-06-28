# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Active |
| < 1.0   | ❌ Not supported |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in IWIS, please report it responsibly:

1. **Email:** Send a detailed report to **iwis.green@proton.me**
2. **Subject Line:** `[SECURITY] Brief description of the vulnerability`
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Acknowledgement:** Within 48 hours
- **Assessment:** Within 7 days
- **Fix & Disclosure:** Within 30 days (coordinated disclosure)

## Scope

The following are in scope for security reports:

- Authentication bypass or privilege escalation
- SQL injection or NoSQL injection
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Server-Side Request Forgery (SSRF)
- Sensitive data exposure (API keys, tokens, PII)
- Insecure direct object references
- Remote code execution

The following are **out of scope**:

- Denial of service (DoS) attacks
- Social engineering
- Issues in third-party dependencies (report upstream)
- Issues requiring physical access to a user's device

## Security Measures

IWIS implements the following security controls:

- **Authentication:** JWT tokens with bcrypt password hashing (cost factor 10)
- **Authorization:** Role-Based Access Control (RBAC) with `citizen` and `recycler` roles
- **Rate Limiting:** Express rate limiter on auth routes (5 req/15min) and general API (100 req/15min)
- **Input Validation:** Zod schema validation on all API endpoints
- **SQL Safety:** Parameterized queries exclusively — no string interpolation
- **CORS:** Configurable origin whitelist
- **Secrets:** Environment variable isolation with `.env` files excluded from version control

## Acknowledgements

We appreciate the security research community. Responsible reporters will be acknowledged in our release notes (with permission).
