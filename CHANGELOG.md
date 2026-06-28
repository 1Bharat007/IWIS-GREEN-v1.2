# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-06-26

### Added

- **AI Waste Scanner** — Gemini Pro Vision integration for real-time material classification from camera photos
- **Citizen Marketplace** — Create waste listings with GPS coordinates for local recycler pickup
- **Recycler Geospatial Feed** — Haversine distance-sorted listing feed with accept/schedule/complete workflow
- **Dynamic Pricing Engine** — Localized scrap price calculator (INR per kg) seeded for Jammu region
- **Gamification System** — Green Points, tier progression (Seed → Sprout → Tree), and leaderboards
- **EcoBot AI Assistant** — RAG-enhanced chatbot with embedded waste management knowledge base
- **Earnings Dashboard** — Interactive Recharts visualizations for CO₂ impact and transaction history
- **Role-Based Authentication** — JWT + bcrypt with isolated Citizen and Recycler experiences
- **Notification System** — Server-generated alerts for listing state changes and achievements
- **Geospatial Hotspot Map** — Leaflet-powered visualization of waste collection activity
- **Password Recovery** — Gmail SMTP integration for secure password reset flow
- **Production Deployment** — Render configuration with environment variable management
- **CI Pipeline** — GitHub Actions workflow for automated build and type-checking

### Security

- Rate limiting on auth routes (5 req/15min) and general API (100 req/15min)
- Zod schema validation on all API endpoints
- Parameterized SQL queries exclusively
- OTP logging suppressed in production (`NODE_ENV=production`)
- API keys excluded from version control via `.gitignore`

### Documentation

- Complete documentation suite: Architecture, API, Database, Security, AI, Deployment, Pilot, Troubleshooting, FAQ
- Professional README with architecture diagrams and tech stack
- Contributing guide with coding standards and commit conventions
- Security policy with responsible disclosure process
