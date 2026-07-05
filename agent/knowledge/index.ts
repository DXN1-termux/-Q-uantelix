// ============================================================
// [Q]uantelix — Knowledge Base
// RAG system: ingest, chunk, embed, store, retrieve
// ============================================================

import { ContextStore } from "../core/context-store";

export interface KnowledgeSource {
  id: string;
  name: string;
  type: "document" | "codebase" | "wiki" | "url" | "pdf";
  content: string;
  chunk_count: number;
  created_at: number;
  updated_at: number;
}

export interface KnowledgeChunk {
  id: string;
  source_id: string;
  content: string;
  embedding?: number[];
  tokens: number;
  position: number; // order within source
  metadata: Record<string, any>;
}

export interface RetrievalResult {
  chunk: KnowledgeChunk;
  score: number;
  source: string;
}

export class KnowledgeBase {
  private store: ContextStore;
  private sources: Map<string, KnowledgeSource> = new Map();
  private chunks: KnowledgeChunk[] = [];

  constructor(store: ContextStore) {
    this.store = store;
  }

  async ingest(name: string, type: KnowledgeSource["type"], content: string): Promise<KnowledgeSource> {
    const id = `ks_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();

    const source: KnowledgeSource = {
      id, name, type, content,
      chunk_count: 0,
      created_at: now,
      updated_at: now,
    };

    this.sources.set(id, source);

    // Chunk the content
    const chunks = this.chunkContent(content, id);
    for (const chunk of chunks) {
      this.chunks.push(chunk);
      this.store.storeChunk({
        id: chunk.id,
        chunk_text: chunk.content,
        token_count: chunk.tokens,
        tier: "warm",
        created_at: now,
        compressed: false,
      });
    }

    source.chunk_count = chunks.length;
    return source;
  }

  private chunkContent(content: string, sourceId: string): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = [];
    const lines = content.split("\n");
    const currentChunk: string[] = [];
    let currentTokens = 0;
    const maxTokens = 500; // Chunk size
    let position = 0;

    for (const line of lines) {
      const lineTokens = Math.ceil(line.length / 4);
      if (currentTokens + lineTokens > maxTokens && currentChunk.length > 0) {
        chunks.push(this.makeChunk(currentChunk.join("\n"), sourceId, position++));
        currentChunk.length = 0;
        currentTokens = 0;
      }
      currentChunk.push(line);
      currentTokens += lineTokens;
    }

    if (currentChunk.length > 0) {
      chunks.push(this.makeChunk(currentChunk.join("\n"), sourceId, position++));
    }

    return chunks;
  }

  private makeChunk(content: string, sourceId: string, position: number): KnowledgeChunk {
    return {
      id: `kc_${sourceId}_${position}`,
      source_id: sourceId,
      content,
      tokens: Math.ceil(content.length / 4),
      position,
      metadata: {},
    };
  }

  retrieve(query: string, maxResults: number = 5): RetrievalResult[] {
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    const scored = this.chunks.map((chunk) => {
      const contentLower = chunk.content.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        const regex = new RegExp(word, "gi");
        const matches = contentLower.match(regex);
        if (matches) score += matches.length;
      }
      // Normalize by chunk length
      score = score / Math.max(1, chunk.tokens);
      return { chunk, score: Math.min(1, score) };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .filter((r) => r.score > 0.01)
      .map((r) => ({
        chunk: r.chunk,
        score: r.score,
        source: this.sources.get(r.chunk.source_id)?.name || "unknown",
      }));
  }

  async removeSource(id: string): Promise<void> {
    this.sources.delete(id);
    this.chunks = this.chunks.filter((c) => c.source_id !== id);
  }

  getSources(): KnowledgeSource[] {
    return Array.from(this.sources.values());
  }

  getStats(): { sources: number; chunks: number; totalTokens: number } {
    return {
      sources: this.sources.size,
      chunks: this.chunks.length,
      totalTokens: this.chunks.reduce((s, c) => s + c.tokens, 0),
    };
  }
}
