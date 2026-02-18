export interface BatchRecord {
  id: string;
  category: string;
  confidence: number;
  co2: number;
  timestamp: string;
}

export interface ImpactData {
  scans: number;
  co2: number;
  streak: number;
  points: number;
  history: BatchRecord[];
}

const defaultData: ImpactData = {
  scans: 0,
  co2: 0,
  streak: 1,
  points: 0,
  history: [],
};

export function getImpact(): ImpactData {
  if (typeof window === "undefined") return defaultData;
  const stored = localStorage.getItem("iwis-impact");
  return stored ? JSON.parse(stored) : defaultData;
}

export function saveImpact(data: ImpactData) {
  localStorage.setItem("iwis-impact", JSON.stringify(data));
}

export function addScanImpact(
  category: string,
  confidence: number,
  co2: number
) {
  const current = getImpact();

  const batch: BatchRecord = {
    id: crypto.randomUUID(),
    category,
    confidence,
    co2,
    timestamp: new Date().toISOString(),
  };

  const updated: ImpactData = {
    scans: current.scans + 1,
    co2: current.co2 + co2,
    streak: current.streak + 1,
    points: current.points + Math.round(co2 * 5),
    history: [batch, ...current.history],
  };

  saveImpact(updated);
  return updated;
}
