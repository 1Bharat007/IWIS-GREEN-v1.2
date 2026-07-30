# Deployment Guide

This guide covers deploying IWIS to production using Render (backend) and Vercel (frontend).

---

## Prerequisites

- A GitHub account with the IWIS repository
- A [Render](https://render.com) account
- A [Vercel](https://vercel.com) account (for frontend, optional)
- A [Google Gemini API key](https://ai.google.dev/)
- A [Clerk](https://clerk.com) application (for authentication)

---

## Backend Deployment (Render)

### Option 1: Using render.yaml (Recommended)

The repository includes a `render.yaml` that provisions both the backend web service
**and** a managed Postgres database in a single Blueprint deploy:

1. Push your code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect `render.yaml`, create the web service, and provision the `iwis-postgres` database automatically.
5. After deploy, add the following secrets in the Render dashboard (these are marked `sync: false` in `render.yaml` so they are never baked into the repo):

| Variable | Where to get it |
|----------|----------------|
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `FRONTEND_URL` | Your Vercel deployment URL |

> **Note:** `DATABASE_URL` is injected automatically by Render via the `fromDatabase` link in `render.yaml`. You do not need to set it manually.
> 
> **Note:** `JWT_SECRET` has been **removed** — authentication is handled entirely by Clerk and the old JWT path is no longer in use.

### Option 2: Manual Setup

1. Go to Render → **New** → **PostgreSQL** and create a database. Copy the connection string.
2. Go to Render → **New** → **Web Service**, connect your GitHub repo, and configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Runtime:** Node
3. Add environment variables as listed above, plus:
   - `DATABASE_URL` — the Postgres connection string from step 1
   - `USE_POSTGRES=true`

---

## Postgres Setup (New Environments)

If you're standing up a fresh environment (local or staging) and need to initialise
the Postgres schema and migrate existing data:

### 1. Run the schema

```bash
cd backend
psql "$DATABASE_URL" -f src/db-postgres-schema.sql
```

This is idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).

### 2. Migrate data from SQLite (if you have an existing iwis.db)

**Always run against a copy — never the live file:**

```bash
cp iwis.db iwis.db.bak
DATABASE_URL=postgresql://... npx ts-node scripts/migrate-data-to-postgres.ts iwis.db.bak
```

The script migrates tables in FK-dependency order, logs per-table row counts before and after,
and fails loudly (non-zero exit) if any table's post-migration Postgres count doesn't match
the SQLite count exactly.

### 3. Verify column-level correctness

```bash
DATABASE_URL=postgresql://... npx ts-node scripts/verify-pg-migration.ts iwis.db.bak
```

Spot-checks up to 10 randomly sampled rows per table (all rows for tables with < 10 rows),
comparing every column value between SQLite and Postgres.

### 4. Enable Postgres in your .env

```bash
USE_POSTGRES=true
DATABASE_URL=postgresql://your-connection-string
```

Restart the backend. The `USE_POSTGRES` flag in `db.ts` routes all controller calls
to Postgres without any controller code changes.

---

## Frontend Deployment (Vercel)

### Setup

```bash
cd frontend
npx vercel --prod
```

Or connect directly from the [Vercel Dashboard](https://vercel.com/dashboard):

1. Import the GitHub repository.
2. Set the **Root Directory** to `frontend`.
3. Add environment variable:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL (e.g., `https://iwis-backend.onrender.com`) |

4. Deploy.

### Frontend on Render

Alternatively, you can deploy the frontend as a second Render web service:

- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

---

## Environment Variables Checklist

Before deploying, verify all required variables are set:

### Backend
- [ ] `GEMINI_API_KEY` — Required for AI scanner
- [ ] `CLERK_SECRET_KEY` — Required for Clerk authentication
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Required for Clerk authentication
- [ ] `DATABASE_URL` — Postgres connection string (auto-injected on Render Blueprint)
- [ ] `USE_POSTGRES=true` — Routes app to Postgres (set in render.yaml)
- [ ] `NODE_ENV=production` — Suppresses development logs
- [ ] `FRONTEND_URL` — Required for CORS whitelist
- [ ] `ENABLE_RAG` — Set to `true` to enable EcoBot knowledge base

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` — Must point to the production backend URL

---

## Health Check

After deployment, verify the backend is running:

```bash
curl https://your-backend-url.onrender.com/api/health
```

Expected: `{ "status": "ok", ... }`

---

## Cold Starts

Render free-tier services spin down after 15 minutes of inactivity. The first request
after spin-down will experience a **30–60 second cold start** while:

1. Node.js process starts
2. Postgres connection pool initialises
3. RAG embeddings are generated (if `ENABLE_RAG=true`)

**Mitigation:**
- Use an external health check service (e.g., UptimeRobot) to ping the backend every 10 minutes.
- Upgrade to Render's paid plan for always-on instances.

> **Note:** The old "SQLite will be wiped on restart" warning no longer applies. The app now uses Render's managed Postgres which persists across all restarts and deploys.

---

## SQLite Fallback (Temporary)

The SQLite path in `db.ts` is preserved as a fallback for local development and
emergency rollback. To use it, set `USE_POSTGRES=false` (or omit the variable) and
ensure `DB_PATH` points to a valid `iwis.db` file.

> ⏳ **Decommission note (future task):** After one full week of confirmed Postgres production usage, the SQLite packages (`sqlite`, `sqlite3`), `db.ts` SQLite init code, and `iwis.db` should be removed. This is tracked as a separate task — do NOT remove them during this migration window.

---

## Monitoring

- **Render Logs:** Available in the Render dashboard under your service → Logs.
- **Startup Validation:** Look for the structured RAG summary and `IWIS Backend running` message.
- **Error Tracking:** Consider adding Sentry for production error monitoring (future enhancement).
