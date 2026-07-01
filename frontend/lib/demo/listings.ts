export const demoListingsHistory = [
  {
    id: "l1",
    materialType: "Plastic",
    wasteVolume: "Large Bag",
    estimatedWeightKg: 12.5,
    status: "scheduled",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    pickupAddress: "45, Gandhi Market, Gandhi Nagar, Jammu",
    recyclerName: "EcoCollect",
    recyclerBusinessName: "EcoCollect Solutions",
    recyclerRating: 4.8,
    recyclerVerified: 1,
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0], // Tomorrow
    scheduledTimeSlot: "10:00 AM - 12:00 PM"
  },
  {
    id: "l2",
    materialType: "Metal",
    wasteVolume: "Medium Bag",
    estimatedWeightKg: 8.2,
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    pickupAddress: "45, Gandhi Market, Gandhi Nagar, Jammu",
    recyclerName: "Greenways",
    recyclerBusinessName: "Greenways Recyclers",
    recyclerRating: 4.5,
    recyclerVerified: 1
  }
];
