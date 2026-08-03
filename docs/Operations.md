# Production Operations, Staging & Incident Playbook

This playbook documents operational procedures for rollbacks, incident investigation order, and provisioning a dedicated staging environment for the IWIS ecosystem.

---

## 1. Fast Incident Triage (What to Check First)

When an alert fires or a production issue is reported, inspect system layers in this exact order:

1. **Sentry Error Dashboard ([app.sentry.io](https://app.sentry.io))**:
   - Check **`iwis-backend`** issues: Look for unhandled Express exceptions, database connection errors, or high-volume 500 status codes. Each event contains `requestId` tags matching backend application logs.
   - Check **`iwis-frontend`** issues: Look for client-side rendering crashes, unhandled hydration errors, or failed API fetch calls.
2. **Render Backend Logs**:
   - Access [dashboard.render.com](https://dashboard.render.com) → Select **`iwis-green-v1-2-1`** → **Logs**.
   - Filter by `[RequestId: ...]` or `[auth.middleware]` to trace specific failed requests.
3. **Vercel Frontend Logs**:
   - Access [vercel.com](https://vercel.com) → Select **`iwis-green-v103`** → **Logs / Observability**.
   - Filter by status code (500/404) or edge middleware execution errors.

---

## 2. Emergency Rollback Playbooks

### A. Render Backend Instant Rollback (`iwis-green-v1-2-1`)
If a newly deployed backend commit introduces a critical regression:

1. Log into [dashboard.render.com](https://dashboard.render.com).
2. Open service **`iwis-green-v1-2-1`**.
3. Click **Events** in the left navigation sidebar.
4. Locate the last known good deployment (prior successful build before the regression).
5. Click **Rollback to this deploy**.
6. Render will re-deploy the previous commit artifact without re-running long build steps, restoring backend stability within ~60 seconds.

### B. Vercel Frontend Instant Rollback (`iwis-green-v103`)
If a frontend release introduces breaking UI or client routing bugs:

1. Log into [vercel.com/dashboard](https://vercel.com/dashboard).
2. Open project **`iwis-green-v103`**.
3. Click **Deployments** in the top navigation bar.
4. Locate the previous successful deployment.
5. Click the **`...` (Options)** menu on the right side of the deployment row.
6. Select **Promote to Production**.
7. Confirm the modal prompt. Vercel will instantly route 100% of production traffic to the previous deployment build within ~5 seconds.

---

## 3. Staging Environment Provisioning Blueprint

To maintain zero downtime and perform pre-release validation before pushing to `main`, set up a dedicated Staging environment using the following blueprint:

### Step 1: Staging PostgreSQL Database
1. In Render Dashboard, click **New +** → **PostgreSQL**.
2. Name: `iwis-postgres-staging`.
3. Instance Type: Starter / Free.
4. Copy the resulting Internal & External `DATABASE_URL` string.

### Step 2: Staging Backend Service (Render)
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect Repository: `1Bharat007/IWIS-GREEN-v1.2`.
3. Branch: `staging` (or pull request previews).
4. Build Command: `cd backend && npm install && npm run build`
5. Start Command: `cd backend && npm start`
6. Set Environment Variables:
   - `NODE_ENV=production`
   - `USE_POSTGRES=true`
   - `DATABASE_URL=<Staging Database Connection String>`
   - `CLERK_SECRET_KEY=<Clerk Staging Test Key>`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<Clerk Staging Test Publishable Key>`
   - `SENTRY_DSN=<Sentry Backend Staging DSN>`

### Step 3: Staging Frontend Project (Vercel Preview)
1. In Vercel Dashboard, import `1Bharat007/IWIS-GREEN-v1.2`.
2. Environment Variables for Preview / Staging Environment:
   - `NEXT_PUBLIC_API_URL=https://iwis-backend-staging.onrender.com`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<Clerk Staging Test Publishable Key>`
   - `NEXT_PUBLIC_SENTRY_DSN=<Sentry Frontend Staging DSN>`
3. Any push to branches other than `main` (e.g. `feature/*` or `staging`) will automatically generate isolated Vercel Preview Deployments for accessibility and integration verification before merging into `main`.
