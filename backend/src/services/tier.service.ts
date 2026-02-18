export const getTier = (scans: number): string => {
  if (scans >= 100) return "Eco Legend";
  if (scans >= 75) return "Climate Champion";
  if (scans >= 50) return "Green Warrior";
  if (scans >= 25) return "Eco Contributor";
  if (scans >= 10) return "Eco Starter";
  return "Getting Started";
};
