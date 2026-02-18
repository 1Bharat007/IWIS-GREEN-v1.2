import crypto from "crypto";

type ScanResult = {
  category: string;
  confidence: number;
  co2: number;
  imageHash: string;
};

const categories = [
  { name: "Plastic", baseCO2: 2.5 },
  { name: "Paper", baseCO2: 1.2 },
  { name: "Metal", baseCO2: 3.8 },
  { name: "Glass", baseCO2: 2.1 },
  { name: "Organic", baseCO2: 0.9 },
];

export const analyzeImage = async (imageBase64: string): Promise<ScanResult> => {
  // Create deterministic hash from image
  const hash = crypto.createHash("sha256").update(imageBase64).digest("hex");

  // Convert hash to number
  const numericSeed = parseInt(hash.slice(0, 8), 16);

  const categoryIndex = numericSeed % categories.length;
  const selected = categories[categoryIndex];

  const confidence = 80 + (numericSeed % 20); // 80-99%
  const co2 = parseFloat(
    (selected.baseCO2 + (numericSeed % 100) / 100).toFixed(2)
  );

  return {
    category: selected.name,
    confidence,
    co2,
    imageHash: hash,
  };
};
