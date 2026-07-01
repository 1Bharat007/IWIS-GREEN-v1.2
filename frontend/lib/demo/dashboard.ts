export const demoDashboardData = {
  totalEarnings: 1250,
  totalRecycledKg: 45.2,
  co2Saved: 18.5,
  activeListings: 2,
  recentNotifications: [
    {
      id: "n1",
      title: "Listing Accepted",
      message: "Greenways Recyclers has accepted your 12kg Plastic listing. Pickup scheduled for today.",
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
      isRead: 0
    },
    {
      id: "n2",
      title: "Payment Received",
      message: "You received ₹450 from EcoCollect for your Metal scrap.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      isRead: 1
    },
    {
      id: "n3",
      title: "Environmental Milestone",
      message: "Congratulations! You've offset the CO₂ equivalent of driving 100km.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      isRead: 1
    }
  ]
};
