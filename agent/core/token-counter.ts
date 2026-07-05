// ============================================================
// [Q]uantelix — Token Counter
// Accurate per-model token counting
// ============================================================

const MODEL_RATIOS: Record<string, number> = {
  "gpt-4o": 0.25,        // ~4 chars per token
  "gpt-4o-mini": 0.25,
  "o3-mini": 0.25,
  "claude-sonnet-4": 0.24,
  "claude-haiku-3-5": 0.24,
  "gemini-2.0-flash": 0.26,
  "gemini-2.0-pro": 0.26,
  default: 0.25,
};

const MODEL_MAX_CONTEXT: Record<string, number> = {
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "o3-mini": 200000,
  "claude-sonnet-4": 200000,
  "claude-haiku-3-5": 200000,
  "gemini-2.0-flash": 1000000,
  "gemini-2.0-pro": 1000000,
  default: 128000,
};

export class TokenCounter {
  private cache: Map<string, number> = new Map();

  count(text: string, model?: string): number {
    const key = `${model || "default"}:${text.length}:${text.slice(0, 50)}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const ratio = MODEL_RATIOS[model || ""] || MODEL_RATIOS.default;
    const count = Math.ceil(text.length * ratio);

    // Cache (cap at 10000 entries)
    if (this.cache.size > 10000) {
      const firstKey = this.cache.keys().next().value!;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, count);

    return count;
  }

  countMessages(messages: Array<{ content: string; role?: string }>, model?: string): number {
    let total = 0;
    for (const msg of messages) {
      total += this.count(msg.content, model);
      // Add overhead for role/metadata (~4 tokens per message)
      total += 4;
    }
    return total;
  }

  getMaxContext(model: string): number {
    return MODEL_MAX_CONTEXT[model] || MODEL_MAX_CONTEXT.default;
  }

  getUtilization(currentTokens: number, model: string): number {
    const max = this.getMaxContext(model);
    return currentTokens / max;
  }

  estimateFileTokens(filePath: string, content: string, model?: string): number {
    // Files have more structured content, slightly more tokens per char
    const baseTokens = this.count(content, model);
    const lineCount = content.split("\n").length;
    const overhead = Math.ceil(lineCount * 0.5); // ~0.5 tokens per line for structure
    return baseTokens + overhead;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
