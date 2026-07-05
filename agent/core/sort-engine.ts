// ============================================================
// [Q]uantelix — Sort Engine
// The intelligence layer: filter → score → rank → select → order
// ============================================================

import { ContextStore, MemoryRow, ContextChunkRow, SortWeightRow } from "./context-store";
import { ScoreCalculator, ScoredItem } from "./score-calculator";
import { Deduplicator } from "./deduplicator";
import { ImportanceClassifier } from "./importance-classifier";

export interface SortResult {
  selected: ScoredItem[];
  totalEvaluated: number;
  totalTokens: number;
  budgetUsed: number;
  budgetMax: number;
  tiers: { hot: number; warm: number; cool: number; cold: number };
  deduplicated: number;
}

export interface SortConfig {
  maxTokens: number;
  tierAllocation: {
    system: number;       // % of budget for system prompt
    retrieved: number;    // % for retrieved context
    recent: number;       // % for recent messages
    working: number;      // % for working memory
    reserve: number;      // % buffer
  };
  minRelevanceThreshold: number;
  halfLifeHot: number;    // ms
  halfLifeWarm: number;
  halfLifeCool: number;
}

const DEFAULT_CONFIG: SortConfig = {
  maxTokens: 128000,
  tierAllocation: {
    system: 0.05,
    retrieved: 0.40,
    recent: 0.25,
    working: 0.20,
    reserve: 0.10,
  },
  minRelevanceThreshold: 0.15,
  halfLifeHot: 3600000,        // 1 hour
  halfLifeWarm: 86400000,      // 1 day
  halfLifeCool: 604800000,     // 7 days
};

export class SortEngine {
  private store: ContextStore;
  private calculator: ScoreCalculator;
  private deduplicator: Deduplicator;
  private classifier: ImportanceClassifier;
  private config: SortConfig;

  constructor(store: ContextStore, config?: Partial<SortConfig>) {
    this.store = store;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.calculator = new ScoreCalculator(store.getSortWeights());
    this.deduplicator = new Deduplicator(0.75);
    this.classifier = new ImportanceClassifier();
  }

  async sort(query: string, recentMessages: MemoryRow[] = []): Promise<SortResult> {
    const startTime = Date.now();
    const budget = this.config.maxTokens;
    const retrievedBudget = Math.floor(budget * this.config.tierAllocation.retrieved);

    // 1. Collect all searchable content
    const allMemories = this.store.getStrongMemories(0.1, 5000);
    const hotChunks = this.store.getChunksByTier("hot", 500);
    const warmChunks = this.store.getChunksByTier("warm", 200);

    // 2. Deduplicate
    const allTexts = [
      ...allMemories.map((m) => m.content),
      ...hotChunks.map((c) => c.chunk_text),
      ...warmChunks.map((c) => c.summary || c.chunk_text),
    ];
    const dedupeResult = this.deduplicator.deduplicate(allTexts);

    // 3. Score all items
    const scoredItems: ScoredItem[] = [];

    // Score memories
    for (const mem of allMemories) {
      const contentType = this.guessContentType(mem.content);
      const scored = this.calculator.scoreItem({
        id: mem.id,
        content: mem.content,
        type: contentType,
        created_at: mem.created_at,
        access_count: mem.access_count,
        importance: mem.importance,
      }, query);
      scoredItems.push(scored);
    }

    // Score hot chunks (higher recency)
    for (const chunk of hotChunks) {
      const contentType = this.guessContentType(chunk.chunk_text);
      const scored = this.calculator.scoreItem({
        id: chunk.id,
        content: chunk.summary || chunk.chunk_text,
        type: contentType,
        created_at: chunk.created_at,
        access_count: 0,
        importance: 0.6,
      }, query);
      // Boost hot tier
      scored.composite *= 1.2;
      scoredItems.push(scored);
    }

    // Score warm chunks
    for (const chunk of warmChunks) {
      const contentType = this.guessContentType(chunk.summary || chunk.chunk_text);
      const scored = this.calculator.scoreItem({
        id: chunk.id,
        content: chunk.summary || chunk.chunk_text,
        type: contentType,
        created_at: chunk.created_at,
        access_count: 0,
        importance: 0.5,
      }, query);
      scoredItems.push(scored);
    }

    // 4. Filter below threshold
    const filtered = this.calculator.filterAboveThreshold(scoredItems, this.config.minRelevanceThreshold);

    // 5. Rank
    const ranked = this.calculator.rank(filtered);

    // 6. Select top-N that fit in budget
    const selected: ScoredItem[] = [];
    let tokensUsed = 0;

    for (const item of ranked) {
      const itemTokens = this.estimateTokens(item.content);
      if (tokensUsed + itemTokens > retrievedBudget) continue;
      selected.push(item);
      tokensUsed += itemTokens;
    }

    // 7. Re-order: retrieved context → recent
    // Recent messages are appended separately by the context manager

    const tierBreakdown = { hot: 0, warm: 0, cool: 0, cold: 0 };
    for (const item of selected) {
      if (item.scores.recency > 0.7) tierBreakdown.hot++;
      else if (item.scores.recency > 0.3) tierBreakdown.warm++;
      else if (item.scores.recency > 0.1) tierBreakdown.cool++;
      else tierBreakdown.cold++;
    }

    return {
      selected,
      totalEvaluated: scoredItems.length,
      totalTokens: tokensUsed,
      budgetUsed: tokensUsed,
      budgetMax: retrievedBudget,
      tiers: tierBreakdown,
      deduplicated: allTexts.length - dedupeResult.unique.length,
    };
  }

  private guessContentType(content: string): string {
    const lower = content.toLowerCase();
    if (/^import\s|^const\s|^function\s|^class\s|```/.test(content)) return "code_snippet";
    if (/^(fix|bug|error|deploy)/i.test(content)) return "error";
    if (lower.includes("file") && (lower.includes("read") || lower.includes("written"))) return "file_read";
    if (lower.includes("command") || lower.includes("terminal")) return "terminal_output";
    if (lower.includes("tool") || lower.includes("executed")) return "tool_result";
    if (/^(user|said|asked)/i.test(content)) return "user_message";
    return "assistant_response";
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  updateConfig(config: Partial<SortConfig>): void {
    this.config = { ...this.config, ...config };
    this.calculator.setWeights(this.store.getSortWeights());
  }

  getConfig(): SortConfig {
    return { ...this.config };
  }
}
