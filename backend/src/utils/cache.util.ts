/**
 * Basic In-Memory LRU Cache for AI Responses.
 * Prevents calling RAG or Gemini repeatedly for identical questions.
 */

interface CacheEntry {
  response: string;
  timestamp: number;
}

class AICache {
  private cache: Map<string, CacheEntry>;
  private readonly maxAgeMs: number;
  private readonly maxSize: number;

  constructor(maxSize = 1000, maxAgeHours = 24) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  }

  private normalizeKey(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/gi, '') // remove punctuation
      .replace(/\s+/g, ' ')     // collapse whitespace
      .trim();
  }

  get(query: string): string | null {
    const key = this.normalizeKey(query);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check expiration
    if (Date.now() - entry.timestamp > this.maxAgeMs) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU behavior)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.response;
  }

  set(query: string, response: string): void {
    const key = this.normalizeKey(query);
    
    // Evict oldest if full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
          this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Export a singleton instance
export const aiCache = new AICache();
