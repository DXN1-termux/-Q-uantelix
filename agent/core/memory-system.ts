// ============================================================
// [Q]uantelix — Memory System
// Biological-inspired: types, lifecycle, decay, strengthen, merge, graph
// ============================================================

import { ContextStore, MemoryRow, ContextChunkRow } from "./context-store";
import { Deduplicator } from "./deduplicator";
import { ImportanceClassifier } from "./importance-classifier";

export interface MemoryCreateInput {
  content: string;
  type?: MemoryRow["type"];
  source?: MemoryRow["source"];
  tags?: string[];
  importance?: number;
  conversation_id?: string;
  session_id?: string;
}

export interface MemoryGraphEdge {
  from: string;
  to: string;
  type: "related" | "caused" | "temporal" | "merged";
  strength: number;
}

export interface MemoryGraph {
  nodes: MemoryRow[];
  edges: MemoryGraphEdge[];
}

export interface MemoryStats {
  total: number;
  byType: Record<string, number>;
  avgStrength: number;
  archived: number;
  merged: number;
}

export class MemorySystem {
  private store: ContextStore;
  private deduplicator: Deduplicator;
  private classifier: ImportanceClassifier;
  private mergeThreshold = 0.8;
  private mergeTimeWindow = 86400000; // 24h

  constructor(store: ContextStore) {
    this.store = store;
    this.deduplicator = new Deduplicator(this.mergeThreshold);
    this.classifier = new ImportanceClassifier();
  }

  // ─── Create ───

  remember(input: MemoryCreateInput): MemoryRow {
    const now = Date.now();
    const id = `mem_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const type = input.type || this.inferType(input.content);
    const importance = input.importance ?? this.classifier.classify(input.content, input.source || "assistant");

    const memory: MemoryRow = {
      id,
      type,
      content: input.content,
      tags: input.tags || [],
      strength: 1.0,
      importance,
      access_count: 0,
      created_at: now,
      last_accessed: now,
      source: input.source || "assistant",
      conversation_id: input.conversation_id,
      session_id: input.session_id,
      related_ids: [],
    };

    this.store.storeMemory(memory);

    // Also store as a context chunk
    this.store.storeChunk({
      id: `chunk_${id}`,
      memory_id: id,
      chunk_text: input.content,
      token_count: Math.ceil(input.content.length / 4),
      tier: "hot",
      created_at: now,
      compressed: false,
    });

    return memory;
  }

  // ─── Recall ───

  recall(query: string, limit: number = 20): MemoryRow[] {
    const results = this.store.searchMemories(query, limit);
    // Strengthen recalled memories
    for (const mem of results) {
      this.store.updateMemoryStrength(mem.id, 0.1);
    }
    return results;
  }

  recallById(id: string): MemoryRow | null {
    const mem = this.store.getMemory(id);
    if (mem) {
      this.store.updateMemoryStrength(id, 0.1);
    }
    return mem;
  }

  recallByType(type: MemoryRow["type"], limit: number = 20): MemoryRow[] {
    return this.store.getMemoriesByType(type, limit);
  }

  // ─── Forget ───

  forget(id: string): boolean {
    const mem = this.store.getMemory(id);
    if (!mem) return false;
    // Demote to very low strength — will be archived on next decay run
    this.store.updateMemoryStrength(id, -1.0);
    return true;
  }

  // ─── Decay ───

  runDecay(): { decayed: number; archived: number; stats: MemoryStats } {
    const result = this.store.decayAllMemories();
    const stats = this.getStats();
    return { decayed: result.decayed, archived: result.archived, stats };
  }

  // ─── Merge ───

  findMergeablePairs(): Array<{ a: MemoryRow; b: MemoryRow; similarity: number }> {
    const recent = this.store.getStrongMemories(0.3, 200);
    const pairs: Array<{ a: MemoryRow; b: MemoryRow; similarity: number }> = [];

    for (let i = 0; i < recent.length; i++) {
      for (let j = i + 1; j < recent.length; j++) {
        const a = recent[i];
        const b = recent[j];

        // Must be within time window
        if (Math.abs(a.created_at - b.created_at) > this.mergeTimeWindow) continue;
        // Must be same type
        if (a.type !== b.type) continue;
        // Already merged
        if (a.parent_id || b.parent_id) continue;

        const sim = this.deduplicator.similarity(a.content, b.content);
        if (sim >= this.mergeThreshold) {
          pairs.push({ a, b, similarity: sim });
        }
      }
    }

    return pairs;
  }

  mergeMemories(a: MemoryRow, b: MemoryRow): MemoryRow {
    // Create merged summary
    const mergedContent = `[Merged from ${a.access_count + b.access_count} sources]\n` +
      `${a.content.slice(0, Math.floor(a.content.length * 0.6))}\n` +
      `...\n` +
      `${b.content.slice(-Math.floor(b.content.length * 0.4))}`;

    const merged = this.remember({
      content: mergedContent,
      type: a.type,
      source: a.source,
      tags: [...new Set([...a.tags, ...b.tags])],
      importance: Math.max(a.importance, b.importance) + 0.05,
      conversation_id: a.conversation_id,
    });

    // Update merged memory to link to parents
    const updated: MemoryRow = {
      ...merged,
      parent_id: undefined,
      related_ids: [a.id, b.id],
      strength: Math.max(a.strength, b.strength) + 0.1,
    };
    this.store.storeMemory(updated);

    // Update parents
    a.parent_id = merged.id;
    b.parent_id = merged.id;
    this.store.storeMemory(a);
    this.store.storeMemory(b);

    return merged;
  }

  // ─── Graph ───

  buildGraph(seedId: string, maxDepth: number = 3): MemoryGraph {
    const visited = new Set<string>();
    const nodes: MemoryRow[] = [];
    const edges: MemoryGraphEdge[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: seedId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);

      const mem = this.store.getMemory(id);
      if (!mem) continue;
      nodes.push(mem);

      // Add edges for related_ids
      for (const relatedId of mem.related_ids) {
        edges.push({ from: id, to: relatedId, type: "related", strength: 0.8 });
        queue.push({ id: relatedId, depth: depth + 1 });
      }

      // Add edges for parent
      if (mem.parent_id) {
        edges.push({ from: id, to: mem.parent_id, type: "merged", strength: 0.9 });
        queue.push({ id: mem.parent_id, depth: depth + 1 });
      }
    }

    return { nodes, edges };
  }

  connectMemories(fromId: string, toId: string, type: MemoryGraphEdge["type"] = "related"): void {
    const from = this.store.getMemory(fromId);
    const to = this.store.getMemory(toId);
    if (!from || !to) return;

    if (!from.related_ids.includes(toId)) {
      from.related_ids.push(toId);
      this.store.storeMemory(from);
    }
    if (!to.related_ids.includes(fromId)) {
      to.related_ids.push(fromId);
      this.store.storeMemory(to);
    }
  }

  // ─── Stats ───

  getStats(): MemoryStats {
    const storeStats = this.store.getMemoryStats();
    const total = storeStats.total || 0;
    const byType: Record<string, number> = {};
    for (const key of ["episodic", "semantic", "procedural", "working"]) {
      byType[key] = storeStats[key] || 0;
    }

    const strongMemories = this.store.getStrongMemories(0, 10000);
    const avgStrength = strongMemories.length > 0
      ? strongMemories.reduce((sum, m) => sum + m.strength, 0) / strongMemories.length
      : 0;

    return {
      total,
      byType,
      avgStrength: Math.round(avgStrength * 100) / 100,
      archived: 0,
      merged: strongMemories.filter((m) => m.parent_id).length,
    };
  }

  // ─── Chunk Management ───

  promoteChunk(chunkId: string, newTier: ContextChunkRow["tier"]): void {
    this.store.compressChunk(chunkId, "", newTier);
  }

  demoteOldestHot(maxHot: number = 1000): number {
    const hot = this.store.getChunksByTier("hot", maxHot + 100);
    if (hot.length <= maxHot) return 0;
    let demoted = 0;
    for (let i = maxHot; i < hot.length; i++) {
      const chunk = hot[i];
      const summary = chunk.chunk_text.slice(0, 200) + "...";
      this.store.compressChunk(chunk.id, summary, "warm");
      demoted++;
    }
    return demoted;
  }

  // ─── Helpers ───

  private inferType(content: string): MemoryRow["type"] {
    const lower = content.toLowerCase();
    if (/^(fix|bug|error|deploy|ran|executed|created|deleted)/i.test(lower)) return "episodic";
    if (/^(def|class|function|import|const|let|var|return)/i.test(content)) return "procedural";
    if (lower.includes("always") || lower.includes("never") || lower.includes("is a") || lower.includes("means")) return "semantic";
    return "episodic";
  }

  clear(): void {
    // This would clear the store — dangerous, only for testing
  }
}
