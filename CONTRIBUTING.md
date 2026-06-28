# Contributing to IWIS

Thank you for your interest in contributing to IWIS! This project aims to build the digital infrastructure for the circular economy, and every contribution matters.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/IWIS-GREEN-v1.2.git
   cd IWIS-GREEN-v1.2
   ```
3. **Install dependencies** for both packages:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
4. **Set up environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
   Edit both files with your local configuration (see [Environment Variables](README.md#-environment-variables)).

5. **Start development servers:**
   ```bash
   # Terminal 1 — Backend
   cd backend && npm run dev

   # Terminal 2 — Frontend
   cd frontend && npm run dev
   ```

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes with clear, focused commits.
3. Verify both projects build cleanly:
   ```bash
   cd backend && npm run build
   cd ../frontend && npm run build
   ```
4. Push your branch and open a Pull Request.

### Branch Naming Convention

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/sms-notifications` |
| `fix/` | Bug fix | `fix/login-redirect` |
| `docs/` | Documentation | `docs/api-examples` |
| `refactor/` | Code refactor | `refactor/auth-middleware` |
| `chore/` | Maintenance | `chore/update-dependencies` |

## Coding Standards

### Frontend (Next.js & React)

- **TypeScript:** Use strict typing. Avoid `any`.
- **Components:** Functional components with React Hooks only.
- **Styling:** Vanilla CSS via CSS Custom Properties (`var(--surface)`, `var(--accent)`). **Do not** introduce Tailwind CSS.
- **State:** Keep component state local where possible. Use Context for cross-cutting concerns only.
- **Imports:** Use `@/` path aliases for project imports.

### Backend (Express & Node.js)

- **Architecture:** MVC pattern — `routes/` → `controllers/` → `services/` → `db.ts`.
- **Validation:** All incoming payloads must be validated with Zod schemas.
- **Database:** Parameterized queries only (`?` placeholders). Never interpolate user input into SQL.
- **Error Handling:** Wrap async controller logic in try/catch. Return structured JSON error responses.
- **Security:** Never log API keys, passwords, or tokens. Sanitize all error messages in production.

### General

- No `console.log` in production code (use structured logging).
- Prefer `const` over `let`. Never use `var`.
- Use early returns to reduce nesting.
- Keep functions small and focused.

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

**Examples:**
```
feat(scanner): add multi-image upload support
fix(auth): handle expired JWT redirect loop
docs(api): add listing endpoint examples
chore(deps): update next.js to v16.2
```

## Pull Request Process

1. Ensure your code passes the CI pipeline (build + typecheck).
2. Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely.
3. Link relevant issues using `Closes #123` or `Fixes #456`.
4. Update documentation if your changes affect APIs, environment variables, or user-facing behavior.
5. Request review from a maintainer. At least one approval is required before merging.

## Reporting Issues

- **Bugs:** Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) template.
- **Features:** Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) template.
- **Security:** See our [Security Policy](SECURITY.md). Do **not** open a public issue for vulnerabilities.

---

Thank you for helping make waste management smarter and more accessible. 🌱
