# Contributing to IWIS

First off, thank you for considering contributing to IWIS! It's people like you that make IWIS such a great platform for environmental sustainability and recycling.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally: `git clone https://github.com/your-username/iwis.git`
3. **Install Dependencies**:
   - `cd backend && npm install`
   - `cd frontend && npm install`
4. **Environment setup**: Copy `.env.example` to `.env` in both folders and fill in your keys.

## Coding Standards (CODE_STYLE)

To maintain a high-quality codebase, please adhere to the following standards:

### Frontend (Next.js & React)
- **TypeScript**: Use strict typing. Avoid `any`.
- **Components**: Use functional components and React Hooks.
- **Styling**: We use Vanilla CSS via CSS Variables (`var(--surface)`, `var(--accent)`) instead of Tailwind CSS. Do not introduce Tailwind classes.
- **State**: Keep component state local where possible.

### Backend (Node.js & Express)
- **Architecture**: MVC pattern (`src/routes`, `src/controllers`, `src/middleware`).
- **Database**: We use `sqlite3` directly. Wrap queries in try/catch blocks.
- **Security**: Always sanitize inputs and pass them via parameterized queries (`?`).

## Branching Strategy

- `main`: Stable production branch.
- `feat/feature-name`: New features.
- `fix/bug-name`: Bug fixes.

## Pull Request Process

1. Ensure your code lints (`npm run lint`).
2. Verify both the frontend and backend build successfully (`npm run build`).
3. Update any relevant documentation (e.g., `API_REFERENCE.md`).
4. Submit a PR against the `main` branch.
5. A maintainer will review your code.
