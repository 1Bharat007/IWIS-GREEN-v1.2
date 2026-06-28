# Troubleshooting

Common issues and their solutions when developing or deploying IWIS.

---

## Build Errors

### `Module '"@/components/ui/Icons"' has no exported member`

**Cause:** An icon was imported that doesn't exist in the Icons component.

**Fix:** Check `frontend/components/ui/Icons.tsx` for available exports. Remove or replace the missing import.

---

### `Cannot find module 'next-themes/dist/types'`

**Cause:** The `next-themes` package restructured its type exports in newer versions.

**Fix:** Change the import from:
```ts
import { type ThemeProviderProps } from "next-themes/dist/types";
```
to:
```ts
import type { ThemeProviderProps } from "next-themes";
```

---

### `models/text-embedding-004 is not found for API version v1beta`

**Cause:** The `text-embedding-004` model name is not compatible with the current `@google/genai` SDK (v1.46+).

**Fix:** Use `gemini-embedding-2` instead. This was resolved in RC-3.1.

---

## Runtime Errors

### `GEMINI_API_KEY is not set`

**Cause:** Missing environment variable.

**Fix:** Copy `.env.example` to `.env` and add your Gemini API key:
```bash
cp backend/.env.example backend/.env
```

---

### Backend starts but API returns 401 on every request

**Cause:** `JWT_SECRET` is missing or different between environments.

**Fix:** Ensure `JWT_SECRET` is set in `backend/.env` and matches the value used when tokens were issued.

---

### AI Scanner returns "Failed to classify"

**Possible Causes:**
1. Gemini API key is invalid or quota exhausted
2. Image payload is too large
3. Network connectivity issue

**Fix:**
- Verify your API key at [Google AI Studio](https://ai.google.dev/)
- Check Render logs for specific error messages
- Ensure the frontend is compressing images before upload

---

### Frontend shows blank page / hydration mismatch

**Cause:** Browser-only APIs (`window`, `localStorage`) used during server-side rendering.

**Fix:** Wrap browser API access in:
```ts
if (typeof window !== "undefined") {
  // Safe to use window, localStorage, etc.
}
```
Or move the logic into a `useEffect` hook.

---

## Deployment Issues

### Render: Database resets on every deploy

**Cause:** Render free-tier uses ephemeral filesystem. SQLite files are lost on restart.

**Fix:**
- Attach a Render persistent disk and set `DB_PATH` to the mounted directory
- Or migrate to PostgreSQL for production persistence

---

### Render: 30–60 second cold start

**Cause:** Free-tier services spin down after 15 minutes of inactivity.

**Fix:**
- Use UptimeRobot to ping the health endpoint every 10 minutes
- Upgrade to Render's paid plan for always-on instances

---

### Vercel: API requests fail with CORS error

**Cause:** The backend CORS whitelist doesn't include the Vercel deployment URL.

**Fix:** Set `FRONTEND_URL` in the Render backend environment to your Vercel URL (e.g., `https://iwis.vercel.app`).

---

### RAG: "All embeddings failed"

**Cause:** Gemini API key doesn't have access to embedding models, or quota is exhausted.

**Fix:**
- Verify the API key has embedding access
- Set `ENABLE_RAG=false` to disable RAG and continue without it
- EcoBot will still function using standard Gemini completions

---

## Development

### `npm run dev` fails with PowerShell execution policy error

**Cause:** Windows PowerShell blocks script execution by default.

**Fix:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Or use `cmd.exe`:
```bash
cmd /c npm run dev
```

---

### Port 5000 already in use

**Fix:** Either kill the existing process or change the port:
```bash
PORT=5001 npm start
```

---

## Getting Help

If your issue isn't listed here:

1. Check existing [GitHub Issues](https://github.com/1Bharat007/IWIS-GREEN-v1.2/issues)
2. Open a new issue using the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)
3. Include: error message, steps to reproduce, environment details (OS, Node version, browser)
