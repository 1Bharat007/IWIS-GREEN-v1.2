export const demoHistoryScans = [
  {
    id: "s1",
    category: "Plastic",
    confidence: 96,
    co2: 1.2,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    thumbnail: "https://images.unsplash.com/photo-1528323273322-d81458248d40?w=200&h=200&fit=crop",
    estimatedPricePerKg: 15
  },
  {
    id: "s2",
    category: "Metal",
    confidence: 89,
    co2: 4.5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    thumbnail: "https://images.unsplash.com/photo-1550508122-f1b209e9dbce?w=200&h=200&fit=crop",
    estimatedPricePerKg: 120
  },
  {
    id: "s3",
    category: "Paper",
    confidence: 92,
    co2: 0.8,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    thumbnail: "https://images.unsplash.com/photo-1603507613524-2195f191bfa3?w=200&h=200&fit=crop",
    estimatedPricePerKg: 8
  }
];
