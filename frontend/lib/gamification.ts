export const getTier = (totalScans: number) => {
  if (totalScans > 50) return "Platinum";
  if (totalScans > 30) return "Gold";
  if (totalScans > 15) return "Silver";
  return "Bronze";
};
