// ============================================================
// [Q]uantelix — Score Calculator
// Multi-dimensional scoring for context prioritization
// ============================================================

export interface ScoredItem {
  id: string;
  content: string;
  type: string;
  scores: {
    relevance: number;
    recency: number;
    importance: number;
    frequency: number;
    type_weight: number;
    emotion: number;
  };
  composite: number;
}

export interface ScoreWeights {
  relevance: number;
  recency: number;
  importance: number;
  frequency: number;
  type_weight: number;
  emotion: number;
}

const TYPE_WEIGHTS: Record<string, number> = {
  code_snippet: 0.9,
  file_edit: 0.85,
  user_instruction: 0.8,
  tool_result: 0.7,
  system_message: 0.6,
  assistant_response: 0.55,
  user_message: 0.5,
  casual_chat: 0.3,
  error: 0.85,
  file_read: 0.75,
  terminal_output: 0.65,
};

const EMOTION_KEYWORDS: Record<string, number> = {
  error: 0.9,
  failed: 0.85,
  important: 0.8,
  critical: 0.9,
  decision: 0.85,
  decided: 0.85,
  remember: 0.8,
  never: 0.7,
  always: 0.7,
  broken: 0.8,
  fixed: 0.75,
  breakthrough: 0.8,
  deploy: 0.7,
  launch: 0.7,
  bug: 0.8,
  security: 0.85,
  password: 0.9,
  secret: 0.9,
  todo: 0.6,
  fixme: 0.7,
};

export class ScoreCalculator {
  private weights: ScoreWeights;

  constructor(weights?: Partial<ScoreWeights>) {
    this.weights = {
      relevance: 0.30,
      recency: 0.20,
      importance: 0.25,
      frequency: 0.10,
      type_weight: 0.10,
      emotion: 0.05,
      ...weights,
    };
  }

  setWeights(weights: Partial<ScoreWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  calculateRelevance(content: string, query: string): number {
    if (!query) return 0.5;
    const contentLower = content.toLowerCase();
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (queryWords.length === 0) return 0.5;

    let matches = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) matches++;
    }
    const wordScore = matches / queryWords.length;

    // Bonus for exact phrase match
    const phraseBonus = contentLower.includes(query.toLowerCase()) ? 0.2 : 0;

    return Math.min(1.0, wordScore * 0.8 + phraseBonus);
  }

  calculateRecency(createdAt: number, halfLifeMs: number = 3600000): number {
    const now = Date.now();
    const age = now - createdAt;
    // Exponential decay
    return Math.exp(-0.693 * age / halfLifeMs);
  }

  calculateImportance(importance: number): number {
    return Math.max(0, Math.min(1, importance));
  }

  calculateFrequency(accessCount: number): number {
    // Logarithmic scaling: each recall helps, diminishing returns
    return Math.min(1.0, Math.log1p(accessCount) / 5);
  }

  calculateTypeWeight(contentType: string): number {
    return TYPE_WEIGHTS[contentType] || 0.5;
  }

  calculateEmotion(content: string): number {
    const lower = content.toLowerCase();
    let maxScore = 0.2; // baseline
    for (const [keyword, score] of Object.entries(EMOTION_KEYWORDS)) {
      if (lower.includes(keyword)) {
        maxScore = Math.max(maxScore, score);
      }
    }
    // Check for ALL CAPS (shouting = important)
    const capsWords = content.match(/\b[A-Z]{3,}\b/g);
    if (capsWords && capsWords.length > 0) {
      maxScore = Math.max(maxScore, 0.6);
    }
    // Check for urgency markers
    if (lower.includes("!!!") || lower.includes("asap") || lower.includes("urgent")) {
      maxScore = Math.max(maxScore, 0.85);
    }
    return maxScore;
  }

  score(
    content: string,
    query: string,
    createdAt: number,
    accessCount: number,
    importance: number,
    contentType: string,
    halfLifeMs?: number
  ): ScoredItem["scores"] & { composite: number } {
    const scores = {
      relevance: this.calculateRelevance(content, query),
      recency: this.calculateRecency(createdAt, halfLifeMs),
      importance: this.calculateImportance(importance),
      frequency: this.calculateFrequency(accessCount),
      type_weight: this.calculateTypeWeight(contentType),
      emotion: this.calculateEmotion(content),
    };

    const composite =
      scores.relevance * this.weights.relevance +
      scores.recency * this.weights.recency +
      scores.importance * this.weights.importance +
      scores.frequency * this.weights.frequency +
      scores.type_weight * this.weights.type_weight +
      scores.emotion * this.weights.emotion;

    return { ...scores, composite };
  }

  scoreItem(item: {
    id: string;
    content: string;
    type: string;
    created_at: number;
    access_count: number;
    importance: number;
  }, query: string): ScoredItem {
    const result = this.score(
      item.content, query, item.created_at, item.access_count, item.importance, item.type
    );
    const { composite, ...scores } = result;
    return { id: item.id, content: item.content, type: item.type, scores, composite };
  }

  rank(items: ScoredItem[]): ScoredItem[] {
    return [...items].sort((a, b) => b.composite - a.composite);
  }

  filterAboveThreshold(items: ScoredItem[], threshold: number = 0.3): ScoredItem[] {
    return items.filter((i) => i.composite >= threshold);
  }
}
