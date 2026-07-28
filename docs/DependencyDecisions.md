# Dependency Upgrade Decisions & Audit Log

This document records technical rationale, test results, and incompatibility details for open or unmerged Dependabot pull requests and major version updates.

---

## 1. `dependabot/npm_and_yarn/backend/backend-dependencies-072715cef2`
- **Branch**: `origin/dependabot/npm_and_yarn/backend/backend-dependencies-072715cef2`
- **Target Component**: Backend Dependencies Group (`backend/`)
- **Key Version Jumps**:
  - `typescript`: `^5.9.3` → `7.0.2`
  - `zod`: `3.23.8` → `4.4.3`
  - `express-rate-limit`: `7.5.1` → `8.6.0`
  - `sqlite3`: `5.1.7` → `6.0.1`
- **Test Result**: **FAIL** on `npm install`
- **Error / Incompatibility Details**:
  ```text
  npm error code ERESOLVE
  npm error ERESOLVE could not resolve dependency:
  npm error peer typescript@">=4.3 <7" from ts-jest@29.4.12
  npm error Found: typescript@7.0.2
  ```
- **Blocking Rationale**:
  1. `ts-jest` v29 peer dependency explicitly requires `typescript < 7.0.0`. Upgrading to TypeScript 7.0.2 breaks backend test suite compilation in `jest`.
  2. `zod` 4.x introduces breaking API changes (`z.infer` and schema validation syntax) that require refactoring all backend validators in `backend/src/validators/`.

---

## 2. `dependabot/npm_and_yarn/backend/backend-dependencies-e75af3e1db`
- **Branch**: `origin/dependabot/npm_and_yarn/backend/backend-dependencies-e75af3e1db` (superseded & auto-closed by Dependabot — branch no longer exists on origin)
- **Status**: **CLOSED** (superseded by branch `072715cef2`)
- **Target Component**: Backend Dependencies Group (`backend/`)
- **Key Version Jumps**:
  - `typescript`: `^5.9.3` → `7.0.2`
  - `zod`: `3.23.8` → `4.4.3`
  - `@google/genai`: `^1.46.0` → `2.13.0`
  - `uuid`: `13.0.0` → `14.0.1`
- **Test Result**: **FAIL** on `npm install`
- **Error / Incompatibility Details**:
  ```text
  npm error ERESOLVE could not resolve peer dependency:
  npm error peer typescript@">=4.3 <7" from ts-jest@29.4.12
  npm error Conflicting peer dependency: typescript@6.0.3 / 7.0.2
  ```
- **Blocking Rationale**: Same peer dependency resolution failure as branch `072715cef2`. TypeScript 7.0.2 conflicts with Jest test runner (`ts-jest`).

---

## 3. `dependabot/npm_and_yarn/frontend/frontend-dependencies-9cd0920399`
- **Branch**: `origin/dependabot/npm_and_yarn/frontend/frontend-dependencies-9cd0920399`
- **Target Component**: Frontend Dependencies Group (`frontend/`)
- **Key Version Jumps**:
  - `tailwindcss`: `3.4.4` → `4.3.3`
  - `next`: `16.1.6` → `16.2.12`
  - `eslint`: `9.39.2` → `10.8.0`
  - `framer-motion`: `12.34.0` → `12.42.2`
- **Test Result**: **FAIL** on `npm run build`
- **Error / Incompatibility Details**:
  ```text
  Error: Turbopack build failed with 3 errors:
  ./app/globals.css
  Error evaluating Node.js code
  Error: It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS with PostCSS you'll need to install `@tailwindcss/postcss` and update your PostCSS configuration.
  ```
- **Blocking Rationale**:
  Tailwind CSS v4 removes the legacy `tailwindcss` PostCSS plugin syntax in favor of `@tailwindcss/postcss` and `@import "tailwindcss";` CSS syntax. Bumping to v4 directly breaks the Next.js production build for `./app/globals.css`, `leaflet.css`, and `leaflet-defaulticon-compatibility.css`. Tailwind v3.4 remains pinned for design system stability.
