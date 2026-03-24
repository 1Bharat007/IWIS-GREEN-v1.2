# IWIS - Waste Management & Incentive System

IWIS is a platform built to tackle waste management through a combination of AI tracking, direct incentives, and a simplified marketplace. We use Gemini AI for waste classification and a "Green Point" system to reward users for sustainable behavior.

## Core Features

- **AI Waste Scanning**: Classification of waste types with suggestions for disposal.
- **Green Points Wallet**: Tracks incentives earned from recycling and marketplace activity.
- **Waste Hotspot Map**: Interactive map with Leaflet to track and report waste areas.
- **Marketplace**: Buy/sell recycled or waste items using a simplified transaction flow.
- **AI Assistant**: Direct chat interface for waste management queries.

## Tech Stack

- **Frontend**: Next.js, Framer Motion (animations), Tailwind CSS, Leaflet (maps), Recharts.
- **Backend**: Node.js, Express, SQLite (v5), Gemini AI (Google Generative AI).
- **Security**: JWT authentication, bcrypt for password hashing.

## Setup Instructions

### Backend
1. Go to the `backend` folder.
2. Create a `.env` file with:
   - `PORT=5000`
   - `GEMINI_API_KEY=your_key_here`
   - `JWT_SECRET=your_secret_here`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend
1. Go to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm run dev
   ```

## Development

The project is structured into a TypeScript backend using a controller-route architecture and a modern React frontend using Next.js App Router.
