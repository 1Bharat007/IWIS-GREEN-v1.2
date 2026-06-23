<div align="center">

# 🌿 IWIS Green

**Intelligent Waste Information System — AI-powered waste management for India's Net Zero 2070 mission**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-iwis--green--v103.vercel.app-4ade80?style=for-the-badge&logo=vercel&logoColor=white)](https://iwis-green-v103.vercel.app)
[![Backend](https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://iwis-green-v1-2-1.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

![TypeScript](https://img.shields.io/badge/TypeScript-98.8%25-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google&logoColor=white)

</div>

---

## 🎯 What is IWIS?

IWIS (Intelligent Waste Information System) is a **full-stack AI + IoT platform** tackling India's 62 million tonne annual waste crisis. It combines **computer vision**, **carbon accounting**, and **gamified incentives** to make waste management measurable, rewarding, and scalable — from individual households to city-level administration.

> 🏆 Aligned with **India's NDC commitments** and **BRSR reporting standards**

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 📸 **AI Waste Scanner** | Multi-class classification (plastic, organic, metal, glass) using **Gemini Vision AI** with confidence scores |
| 🌱 **Carbon Accounting** | Calculates avoided CO₂ per scan batch — Scope 3 compliant |
| 🏆 **Green Points Wallet** | Gamified reward system with weekly streaks, leaderboards & tier progression (Bronze → Gold) |
| 🗺️ **Waste Hotspot Map** | Leaflet-powered geospatial map tracking illegal dumping with real-time coordinates |
| ♻️ **Circular Marketplace** | Connects citizens to MRF (Material Recovery Facilities) operators with a bid-based system |
| 🤖 **EcoBot AI Assistant** | 24/7 AI chatbot trained on India's waste management policies |
| 🔐 **Auth System** | JWT-based auth with email/password reset via Gmail SMTP |

---

## 🏗️ Architecture

```
iwis/
├── frontend/          # Next.js 15 App Router
│   ├── app/
│   │   ├── scan/          # AI waste scanner
│   │   ├── dashboard/     # User stats & carbon metrics
│   │   ├── map/           # Leaflet hotspot map
│   │   ├── marketplace/   # Circular economy listings
│   │   ├── leaderboard/   # Community rankings
│   │   ├── chat/          # EcoBot AI assistant
│   │   └── history/       # Past scan history
│   └── lib/
│       ├── api.ts         # Centralized API client
│       └── session.ts     # JWT session management
│
└── backend/           # Node.js + Express + TypeScript
    └── src/
        ├── controllers/   # Business logic
        ├── routes/        # API route definitions
        ├── middleware/     # JWT auth guard
        ├── utils/         # Gemini AI fallback handler
        └── db.ts          # SQLite schema & migrations
```

---

## 🛠️ Tech Stack

**Frontend**
- [Next.js 15](https://nextjs.org/) (App Router) + TypeScript
- Tailwind CSS + Custom animations
- Leaflet.js for interactive maps
- Recharts for data visualization

**Backend**
- Node.js + Express 5 + TypeScript
- SQLite (via `sqlite`/`sqlite3`) — zero-infrastructure DB
- Gemini AI (`@google/genai`) with multi-key fallback system
- Nodemailer (Gmail SMTP) for transactional emails
- JWT + bcrypt for authentication

**Deployment**
- 🖥️ Frontend → [Vercel](https://vercel.com)
- ⚙️ Backend → [Render](https://render.com)

---

## ⚡ Local Setup

### Prerequisites
- Node.js 18+
- A [Gemini API Key](https://aistudio.google.com/app/apikey)

### Backend

```bash
cd backend
```

Create `.env`:
```env
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=your_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16char_app_password
```

```bash
npm install
npm run dev        # TypeScript dev server (ts-node-dev)
# or
npm run build      # Compile to dist/
npm start          # Run compiled output
```

### Frontend

```bash
cd frontend
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🚀

---

## 🌐 Live Deployment

| Service | URL |
|---|---|
| Frontend (Vercel) | [iwis-green-v103.vercel.app](https://iwis-green-v103.vercel.app) |
| Backend (Render) | [iwis-green-v1-2-1.onrender.com](https://iwis-green-v1-2-1.onrender.com) |

> ⚠️ The backend runs on Render's **free tier** — it may cold-start in ~30s on first request.

---

## 📊 Database Schema

```sql
users           -- id, email, password, role, totalCO2, streak, tier, greenPoints
batches         -- id, userId, category, confidence, co2, lat, lng, timestamp
listings        -- id, batchId, userId, status, priceRange
bids            -- id, listingId, recyclerId, offerAmount, status
reset_tokens    -- token, userId, expiresAt
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [1Bharat007](https://github.com/1Bharat007)

---

<div align="center">
  <sub>Built with 💚 to tackle India's waste crisis — one scan at a time</sub>
</div>
