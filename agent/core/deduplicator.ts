// ============================================================
// [Q]uantelix — Deduplicator
// Detects and merges near-duplicate context
// ============================================================

export interface DedupeResult {
  unique: string[];
  duplicates: Array<{ original: string; duplicate: string; similarity: number }>;
}

export class Deduplicator {
  private similarityThreshold: number;

  constructor(threshold: number = 0.8) {
    this.similarityThreshold = threshold;
  }

  // Jaccard similarity on word sets
  private jaccardSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  // n-gram based similarity for short texts
  private ngramSimilarity(a: string, b: string, n: number = 3): number {
    if (a.length < n || b.length < n) return this.jaccardSimilarity(a, b);
    const ngramsA = new Set<string>();
    const ngramsB = new Set<string>();
    for (let i = 0; i <= a.length - n; i++) ngramsA.add(a.slice(i, i + n));
    for (let i = 0; i <= b.length - n; i++) ngramsB.add(b.slice(i, i + n));
    const intersection = new Set([...ngramsA].filter((g) => ngramsB.has(g)));
    const union = new Set([...ngramsA, ...ngramsB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  similarity(a: string, b: string): number {
    const jaccard = this.jaccardSimilarity(a, b);
    const ngram = this.ngramSimilarity(a, b);
    return jaccard * 0.6 + ngram * 0.4;
  }

  deduplicate(texts: string[]): DedupeResult {
    const unique: string[] = [];
    const duplicates: DedupeResult["duplicates"] = [];
    const used = new Set<number>();

    for (let i = 0; i < texts.length; i++) {
      if (used.has(i)) continue;
      unique.push(texts[i]);

      for (let j = i + 1; j < texts.length; j++) {
        if (used.has(j)) continue;
        const sim = this.similarity(texts[i], texts[j]);
        if (sim >= this.similarityThreshold) {
          duplicates.push({ original: texts[i], duplicate: texts[j], similarity: sim });
          used.add(j);
        }
      }
    }

    return { unique, duplicates };
  }

  deduplicateById<T extends { id: string; content: string }>(items: T[]): {
    unique: T[];
    removed: T[];
  } {
    const result = this.deduplicate(items.map((i) => i.content));
    const removed: T[] = [];
    const unique: T[] = [];

    const duplicateTexts = new Set(result.duplicates.map((d) => d.duplicate));
    for (const item of items) {
      if (duplicateTexts.has(item.content)) {
        removed.push(item);
      } else {
        unique.push(item);
      }
    }

    return { unique, removed };
  }
}
