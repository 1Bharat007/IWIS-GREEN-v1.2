# IWIS Roadmap

Our roadmap is structured transparently to show where the project currently stands and where it is heading post-pilot.

## ✅ Completed (v1.0 RC)
- AI Waste Classification Engine (Gemini Vision)
- Citizen Scan & Sell Workflow
- Recycler Geospatial Feed (Haversine Distance)
- Localized Scrap Pricing Engine
- Double-Click & Rate Limit Defenses
- JWT Authentication & RBAC

## 🔄 In Progress (Pilot Phase)
- **Jammu Field Pilot:** Onboarding local Kabadiwalas and 500+ citizens.
- **UX Tuning:** Monitoring real-world outdoor usage of the mobile-responsive UI.
- **AI Analytics:** Tuning the RAG Vector DB to provide better localized waste management tips.

## 📅 Planned (v1.x)
- **Service Workers (PWA):** Offline support allowing citizens to queue waste scans without cellular data.
- **Multilingual Support:** Full Hindi (hi-IN) translation layer.
- **SMS Integration:** Replace development OTPs with Twilio / MSG91.

## 🚀 Future (v2.0 & Enterprise)
- **Database Migration:** Transition from SQLite to PostgreSQL (Supabase/Neon) for horizontal scalability.
- **Cloud Storage:** Offload Base64 thumbnails to AWS S3 or Cloudinary.
- **Live Tracking:** Socket.io integration for real-time Recycler ETA tracking (Uber-style).
