export function calculateCarbon(category: string) {
  const emissionFactors: Record<string, number> = {
    Plastic: 2.5,
    Organic: 1.8,
    Metal: 3.2,
  };

  const baseFactor = emissionFactors[category] || 1.0;

  const avoided = baseFactor * 1.1; // conservative multiplier

  return parseFloat(avoided.toFixed(2));
}

export function explainCarbon(category: string) {
  const explanations: Record<string, string> = {
    Plastic:
      "Recycling plastic prevents fossil fuel extraction and reduces landfill methane risk.",
    Organic:
      "Diverting organic waste prevents methane emissions from landfill decomposition.",
    Metal:
      "Recycling metal significantly reduces energy usage compared to virgin mining.",
  };

  return explanations[category] || "Carbon impact calculated using conservative emission factors.";
}
