export const demoRecyclerFeed = [
  {
    id: "f1",
    citizenName: "Rahul Sharma",
    materialType: "Plastic",
    wasteVolume: "Large Bag",
    estimatedWeightKg: 12.5,
    pickupAddress: "45, Gandhi Market, Gandhi Nagar, Jammu",
    description: "Mostly PET bottles and clean plastic containers.",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    distanceKm: "1.2"
  },
  {
    id: "f2",
    citizenName: "Priya Singh",
    materialType: "Paper",
    wasteVolume: "Carton Box",
    estimatedWeightKg: 25.0,
    pickupAddress: "12A, Trikuta Nagar Sector 3, Jammu",
    description: "Old newspapers and cardboard boxes.",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    distanceKm: "2.8"
  },
  {
    id: "f3",
    citizenName: "Amit Verma",
    materialType: "Metal",
    wasteVolume: "Medium Bag",
    estimatedWeightKg: 8.2,
    pickupAddress: "77, Shastri Nagar, Jammu",
    description: "Aluminum cans and some old utensils.",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    distanceKm: "4.5"
  }
];
