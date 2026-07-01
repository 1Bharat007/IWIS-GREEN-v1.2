import { getDB } from "../db";

// Helper function to calculate distance using Haversine formula
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
};

export const getSmartListingsForRecycler = async (recyclerId: string) => {
  const db = await getDB();
  
  const recycler = await db.get("SELECT lat, lng, typeOfMaterials, maxPickupRadiusKm FROM recycler_profiles WHERE userId = ?", recyclerId);
  const recyclerLat = recycler?.lat || 28.6139;
  const recyclerLng = recycler?.lng || 77.2090;
  
  // Get scrap prices to calculate profit margins
  const prices = await db.all("SELECT material, pricePerKg FROM scrap_prices");
  const priceMap = new Map(prices.map((p: any) => [p.material, p.pricePerKg]));

  const listings = await db.all(`
    SELECT l.*, u.name as citizenName 
    FROM waste_listings l
    JOIN users u ON l.citizenId = u.id
    WHERE l.status = 'listed'
  `);

  const scoredListings = listings.map((listing: any) => {
    // 1. Distance Score
    const distanceKm = getDistanceKm(recyclerLat, recyclerLng, listing.lat || recyclerLat, listing.lng || recyclerLng);
    const distanceScore = Math.max(0, 100 - (distanceKm * 5)); // Lose 5 points per km

    // 2. Urgency Score (Based on days since creation)
    const daysOld = (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 3600 * 24);
    const urgencyScore = Math.min(100, daysOld * 20); // Maxes out at 5 days

    // 3. Profitability (Estimated)
    const basePrice = Number(priceMap.get(listing.materialType)) || 5;
    const estimatedValue = basePrice * (listing.estimatedWeightKg || 1);
    
    // Assume 30% profit margin minus fuel cost (10 rs per km)
    const fuelCost = distanceKm * 10;
    const estimatedProfit = (estimatedValue * 0.30) - fuelCost;
    
    // Profit Score
    const profitScore = Math.max(0, Math.min(100, estimatedProfit)); 

    // 4. Route Score (High if close, high if profitable)
    const routeScore = (distanceScore * 0.6) + (profitScore * 0.4);

    // 5. Total Priority Score
    const priorityScore = (distanceScore * 0.3) + (urgencyScore * 0.2) + (profitScore * 0.5);

    let pickupRecommendation = "Standard Pickup";
    if (priorityScore > 80 && estimatedProfit > 200) {
      pickupRecommendation = "Highly Recommended - Profitable & Close";
    } else if (urgencyScore > 80) {
      pickupRecommendation = "Urgent Pickup Needed";
    } else if (estimatedProfit < 0) {
      pickupRecommendation = "Not Recommended - Net Loss";
    }

    return {
      ...listing,
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      distanceScore: Math.round(distanceScore),
      urgencyScore: Math.round(urgencyScore),
      profitScore: Math.round(profitScore),
      routeScore: Math.round(routeScore),
      priorityScore: Math.round(priorityScore),
      estimatedProfit: Math.round(estimatedProfit),
      pickupRecommendation
    };
  });

  // Sort by priority
  return scoredListings.sort((a: any, b: any) => b.priorityScore - a.priorityScore);
};

export const getRecyclerDashboardStats = async (recyclerId: string) => {
  const db = await getDB();

  const todayStr = new Date().toISOString().split("T")[0];

  const todaysPickups = await db.get(`
    SELECT COUNT(*) as count FROM waste_listings
    WHERE recyclerId = ? AND scheduledDate = ? AND status = 'scheduled'
  `, [recyclerId, todayStr]);

  const completed = await db.get(`
    SELECT COUNT(*) as count, SUM(finalValue) as revenue FROM waste_listings
    WHERE recyclerId = ? AND status = 'completed'
  `, recyclerId);

  // Acceptance rate
  const totalOffered = await db.get(`SELECT COUNT(*) as count FROM bids WHERE recyclerId = ?`, recyclerId);
  const acceptedBids = await db.get(`SELECT COUNT(*) as count FROM bids WHERE recyclerId = ? AND status = 'accepted'`, recyclerId);
  
  let acceptanceRate = 0;
  if (totalOffered && totalOffered.count > 0) {
    acceptanceRate = (acceptedBids.count / totalOffered.count) * 100;
  } else {
    // If we don't have a robust bidding history yet, approximate it based on scheduled vs cancelled
    const scheduled = await db.get(`SELECT COUNT(*) as count FROM waste_listings WHERE recyclerId = ? AND status IN ('scheduled', 'completed')`, recyclerId);
    const cancelled = await db.get(`SELECT COUNT(*) as count FROM waste_listings WHERE recyclerId = ? AND status = 'cancelled'`, recyclerId);
    const total = (scheduled?.count || 0) + (cancelled?.count || 0);
    if (total > 0) {
      acceptanceRate = (scheduled.count / total) * 100;
    }
  }

  // Average Response Time (Mocked for now since we don't track notification read times perfectly)
  const averageResponseTimeMins = 14; 

  return {
    todaysPickups: todaysPickups?.count || 0,
    completedPickups: completed?.count || 0,
    revenue: completed?.revenue || 0,
    acceptanceRate: Math.round(acceptanceRate),
    averageResponseTimeMins
  };
};
