# IWIS v1.0.0 Release Notes

We are incredibly proud to announce the **v1.0.0 Open Source Release** of IWIS (Intelligent Waste Information System). 

This release marks the transition from our initial closed prototypes into a production-grade, globally accessible open-source repository. It is the exact build powering the inaugural Jammu field pilot.

## 🌍 Why IWIS Exists
Urban waste management remains a critical environmental hazard. Much of recyclable waste ends up in landfills because there is no frictionless, incentivized bridge between the everyday Citizen and the local Kabadiwala (Recycler). 

**IWIS solves this.** We put an AI scanner in the pocket of every citizen, telling them exactly what their waste is and what it’s worth, and then instantly broadcast that waste to nearby verified recyclers through a geospatial live feed.

## 🚀 Highlights & Features

### 1. AI-Powered Waste Classification
Powered by Gemini Pro Vision, users simply snap a photo. The system identifies the material (e.g., PET Plastic, Corrugated Cardboard), estimates the weight, and calculates a dynamic localized value.

### 2. Gamified Citizen Dashboard
Citizens earn **Green Points** for every successful collection, leveling up through ecological tiers (Seed -> Sprout -> Tree) while tracking their total offset CO2 footprint.

### 3. Kabadiwala Geospatial Feed
Recyclers gain access to a dedicated dashboard showing active listings in their vicinity, sorted by distance using Haversine geospatial calculations. They can claim listings, schedule pickups, and confirm weights natively.

### 4. Enterprise-Grade Security
Stateless JWT authentication, Zod input validation, rate-limiting, and Role-Based Access Control (RBAC) ensure the platform is secure by default.

## ⚠️ Known Limitations
Transparency is a core value of this open-source project. This is an MVP designed for velocity.
- Uses **SQLite** (does not support horizontal scaling out-of-the-box).
- Uses **Base64** WebP image storage (requires future migration to S3).
- **OTP SMS** is mocked to the console in development to save API costs.
*See [KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) for full details.*

## 🛣️ Future Roadmap
v1.0.0 is just the beginning. Our sights are set on **Service Workers (Offline Support)**, **PostgreSQL Migration**, and **Socket.io Live Tracking**. 

## 🤝 Contribution Invitation
We built IWIS to be extended by municipalities, universities, and open-source contributors worldwide. 
- Want to add a new localized Scrap Pricing engine?
- Want to integrate Twilio for production OTPs?

Check out our [CONTRIBUTING.md](docs/CONTRIBUTING.md) and jump into the issue tracker. Together, we can build the digital infrastructure for a circular economy.
