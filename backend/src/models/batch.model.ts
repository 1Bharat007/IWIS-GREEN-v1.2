export interface Batch {
  id: string;
  category: string;
  confidence: number;
  co2: number;
  timestamp: Date;
}

export const batchStore: Batch[] = [];
