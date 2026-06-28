# Frequently Asked Questions

## General

### What is IWIS?

IWIS (Intelligent Waste Information System) is an AI-powered civic-tech platform that connects citizens with local recyclers (Kabadiwalas) to monetize household waste. Citizens scan waste with AI, list it on a marketplace, and nearby recyclers pick it up — creating income from recyclable materials that would otherwise go to landfills.

### Is IWIS free to use?

Yes. IWIS is open-source under the MIT License. Citizens and recyclers can use the platform at no cost. The Gemini AI integration uses Google's free tier.

### What regions does IWIS support?

v1.0 is seeded with scrap pricing data for **Jammu, India**. The architecture supports adding new regions by inserting rows into the `scrap_prices` table.

---

## For Citizens

### How does the AI Scanner work?

Take a photo of your waste using the Scan page. The image is compressed in your browser and sent to Google's Gemini Vision AI, which identifies the material type, estimates the weight, and calculates its market value based on local scrap prices.

### How accurate is the AI classification?

Gemini Pro Vision typically achieves 85–98% confidence on common recyclable materials (plastic bottles, cardboard, metal cans, glass). Accuracy is lower for mixed or contaminated waste.

### How do I get paid?

After creating a listing, a nearby recycler accepts it and schedules a pickup. When they arrive, they weigh the material on a physical scale and confirm the collection. You receive payment based on the actual weight multiplied by the current scrap price per kilogram.

### What are Green Points?

Green Points are a gamification feature. You earn points for every successful recycling transaction. Points contribute to your tier (Seed → Sprout → Tree) and leaderboard ranking.

---

## For Recyclers

### How do I find waste listings?

The Recycler Feed shows active listings sorted by distance from your location. You can accept a listing, schedule a pickup time, and navigate to the citizen's address.

### Can two recyclers accept the same listing?

No. The system uses pessimistic locking — once a recycler accepts a listing, its status changes to `accepted` and it's removed from other recyclers' feeds.

### How is the final payout calculated?

The payout is calculated as: `actual_weight_kg × price_per_kg`. The recycler enters the actual weight at the time of physical collection.

---

## Technical

### Can I run IWIS without a Gemini API key?

Partially. The AI Scanner and EcoBot require a Gemini API key. All other features (authentication, listings, recycler feed, notifications) work without one. You can get a free API key at [ai.google.dev](https://ai.google.dev/).

### Can I disable the RAG/EcoBot features?

Yes. Set `ENABLE_RAG=false` in `backend/.env`. EcoBot will still respond using standard Gemini completions, but without the knowledge base context.

### Does IWIS work offline?

IWIS displays friendly error messages when offline but does not queue requests for background sync. Active network connectivity (3G/4G/WiFi) is required for scanning, listing, and accepting operations.

### Can I use PostgreSQL instead of SQLite?

Not yet in v1.0. The schema is designed for PostgreSQL compatibility, and migration is planned for v2.0. See the [Roadmap](Roadmap.md).

### How do I add a new region with local pricing?

Insert rows into the `scrap_prices` table via the SQLite CLI or a future admin interface:

```sql
INSERT INTO scrap_prices (id, materialType, pricePerKg, region, updatedAt)
VALUES ('uuid', 'PET Plastic', 15.00, 'Delhi', datetime('now'));
```

---

## Contributing

### How can I contribute?

See our [Contributing Guide](../CONTRIBUTING.md). We welcome code contributions, documentation improvements, translations, and feedback from municipalities and civic organizations.

### I found a security vulnerability. What should I do?

**Do not open a public issue.** Please report it privately by following our [Security Policy](../SECURITY.md).
