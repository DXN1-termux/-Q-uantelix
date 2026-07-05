// ============================================================
// [Q]uantelix — Context Store (SQLite)
// Persistent storage for memories, context chunks, sort weights
// ============================================================

import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export interface MemoryRow {
  id: string;
  type: "episodic" | "semantic" | "procedural" | "working";
  content: string;
  tags: string[];
  strength: number;
  importance: number;
  access_count: number;
  created_at: number;
  last_accessed: number;
  source: "user" | "assistant" | "tool" | "system";
  conversation_id?: string;
  session_id?: string;
  parent_id?: string;
  related_ids: string[];
}

export interface ContextChunkRow {
  id: string;
  memory_id?: string;
  chunk_text: string;
  token_count: number;
  tier: "hot" | "warm" | "cool" | "cold";
  created_at: number;
  compressed: boolean;
  summary?: string;
}

export interface SortWeightRow {
  dimension: string;
  weight: number;
}

const DEFAULT_SORT_WEIGHTS: Record<string, number> = {
  relevance: 0.30,
  recency: 0.20,
  importance: 0.25,
  frequency: 0.10,
  type_weight: 0.10,
  emotion: 0.05,
};

export class ContextStore {
  private dbPath: string;
  private initialized = false;

  constructor(dataDir?: string) {
    const dir = dataDir || path.join(process.env.HOME || "/root", ".quantelix");
    fs.mkdirSync(dir, { recursive: true });
    this.dbPath = path.join(dir, "context.db");
  }

  private sql(query: string): string {
    try {
      const result = execSync(`sqlite3 -json "${this.dbPath}" "${query.replace(/"/g, '\\"')}"`, {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });
      return result.trim();
    } catch {
      return "";
    }
  }

  private exec(query: string): void {
    execSync(`sqlite3 "${this.dbPath}" "${query.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
    });
  }

  private queryAll(query: string): any[] {
    const raw = this.sql(query);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private queryOne(query: string): any | null {
    const results = this.queryAll(query);
    return results.length > 0 ? results[0] : null;
  }

  init(): void {
    if (this.initialized) return;

    this.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('episodic','semantic','procedural','working')),
        content TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        strength REAL DEFAULT 1.0,
        importance REAL DEFAULT 0.5,
        access_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        last_accessed INTEGER NOT NULL,
        source TEXT DEFAULT 'assistant',
        conversation_id TEXT,
        session_id TEXT,
        parent_id TEXT,
        related_ids TEXT DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS context_chunks (
        id TEXT PRIMARY KEY,
        memory_id TEXT,
        chunk_text TEXT NOT NULL,
        token_count INTEGER NOT NULL DEFAULT 0,
        tier TEXT NOT NULL DEFAULT 'hot' CHECK(tier IN ('hot','warm','cool','cold')),
        created_at INTEGER NOT NULL,
        compressed INTEGER DEFAULT 0,
        summary TEXT,
        FOREIGN KEY (memory_id) REFERENCES memories(id)
      );

      CREATE TABLE IF NOT EXISTS sort_weights (
        dimension TEXT PRIMARY KEY,
        weight REAL NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_memories_strength ON memories(strength DESC);
      CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_chunks_tier ON context_chunks(tier);
      CREATE INDEX IF NOT EXISTS idx_chunks_memory ON context_chunks(memory_id);
    `);

    // Seed default sort weights if empty
    const existing = this.queryAll("SELECT COUNT(*) as cnt FROM sort_weights");
    if (existing[0]?.cnt === 0) {
      for (const [dim, weight] of Object.entries(DEFAULT_SORT_WEIGHTS)) {
        this.exec(`INSERT INTO sort_weights (dimension, weight) VALUES ('${dim}', ${weight})`);
      }
    }

    this.initialized = true;
  }

  // ─── Memory Operations ───

  storeMemory(mem: MemoryRow): void {
    this.exec(`INSERT OR REPLACE INTO memories 
      (id, type, content, tags, strength, importance, access_count, created_at, last_accessed, source, conversation_id, session_id, parent_id, related_ids)
      VALUES ('${mem.id}', '${mem.type}', '${mem.content.replace(/'/g, "''")}', '${JSON.stringify(mem.tags).replace(/'/g, "''")}',
        ${mem.strength}, ${mem.importance}, ${mem.access_count}, ${mem.created_at}, ${mem.last_accessed},
        '${mem.source}', ${mem.conversation_id ? `'${mem.conversation_id}'` : 'NULL'},
        ${mem.session_id ? `'${mem.session_id}'` : 'NULL'},
        ${mem.parent_id ? `'${mem.parent_id}'` : 'NULL'},
        '${JSON.stringify(mem.related_ids).replace(/'/g, "''")}')`);
  }

  getMemory(id: string): MemoryRow | null {
    const row = this.queryOne(`SELECT * FROM memories WHERE id = '${id}'`);
    return row ? this.rowToMemory(row) : null;
  }

  searchMemories(query: string, limit: number = 50): MemoryRow[] {
    const rows = this.queryAll(
      `SELECT * FROM memories WHERE content LIKE '%${query.replace(/'/g, "''")}%' ORDER BY strength DESC, created_at DESC LIMIT ${limit}`
    );
    return rows.map((r) => this.rowToMemory(r));
  }

  getMemoriesByType(type: MemoryRow["type"], limit: number = 100): MemoryRow[] {
    const rows = this.queryAll(
      `SELECT * FROM memories WHERE type = '${type}' ORDER BY strength DESC, created_at DESC LIMIT ${limit}`
    );
    return rows.map((r) => this.rowToMemory(r));
  }

  getStrongMemories(minStrength: number = 0.5, limit: number = 100): MemoryRow[] {
    const rows = this.queryAll(
      `SELECT * FROM memories WHERE strength >= ${minStrength} ORDER BY strength DESC LIMIT ${limit}`
    );
    return rows.map((r) => this.rowToMemory(r));
  }

  updateMemoryStrength(id: string, delta: number): void {
    this.exec(`UPDATE memories SET strength = MIN(1.0, MAX(0.0, strength + ${delta})), 
      access_count = access_count + 1, last_accessed = ${Date.now()} WHERE id = '${id}'`);
  }

  decayAllMemories(): { decayed: number; archived: number } {
    const now = Date.now();
    const DAY = 86400000;
    const HOUR = 3600000;

    // Working: 0.8 per hour
    this.exec(`UPDATE memories SET strength = strength * 0.8 WHERE type = 'working' AND last_accessed < ${now - HOUR}`);

    // Episodic: 0.95 per day
    this.exec(`UPDATE memories SET strength = strength * 0.95 WHERE type = 'episodic' AND last_accessed < ${now - DAY}`);

    // Semantic: 0.99 per week
    this.exec(`UPDATE memories SET strength = strength * 0.99 WHERE type = 'semantic' AND last_accessed < ${now - 7 * DAY}`);

    // Procedural: 0.999 per month
    this.exec(`UPDATE memories SET strength = strength * 0.999 WHERE type = 'procedural' AND last_accessed < ${now - 30 * DAY}`);

    // Archive weak memories (demote to cold tier)
    const archived = this.queryAll(`SELECT COUNT(*) as cnt FROM memories WHERE strength < 0.1 AND type != 'working'`);
    this.exec(`DELETE FROM context_chunks WHERE memory_id IN (SELECT id FROM memories WHERE strength < 0.1 AND type != 'working')`);
    this.exec(`DELETE FROM memories WHERE strength < 0.1 AND type != 'working'`);

    return { decayed: 0, archived: archived[0]?.cnt || 0 };
  }

  getMemoryCount(): number {
    const r = this.queryOne("SELECT COUNT(*) as cnt FROM memories");
    return r?.cnt || 0;
  }

  getMemoryStats(): Record<string, number> {
    const rows = this.queryAll("SELECT type, COUNT(*) as cnt, AVG(strength) as avg_strength FROM memories GROUP BY type");
    const stats: Record<string, number> = { total: 0 };
    for (const row of rows) {
      stats[row.type] = row.cnt;
      stats[`${row.type}_avg_strength`] = Math.round(row.avg_strength * 100) / 100;
      stats.total += row.cnt;
    }
    return stats;
  }

  // ─── Context Chunk Operations ───

  storeChunk(chunk: ContextChunkRow): void {
    this.exec(`INSERT OR REPLACE INTO context_chunks
      (id, memory_id, chunk_text, token_count, tier, created_at, compressed, summary)
      VALUES ('${chunk.id}', ${chunk.memory_id ? `'${chunk.memory_id}'` : 'NULL'},
        '${chunk.chunk_text.replace(/'/g, "''")}', ${chunk.token_count}, '${chunk.tier}',
        ${chunk.created_at}, ${chunk.compressed ? 1 : 0}, ${chunk.summary ? `'${chunk.summary.replace(/'/g, "''")}'` : 'NULL'})`);
  }

  getChunksByTier(tier: ContextChunkRow["tier"], limit: number = 100): ContextChunkRow[] {
    const rows = this.queryAll(
      `SELECT * FROM context_chunks WHERE tier = '${tier}' ORDER BY created_at DESC LIMIT ${limit}`
    );
    return rows.map((r) => this.rowToChunk(r));
  }

  searchChunks(query: string, limit: number = 20): ContextChunkRow[] {
    const rows = this.queryAll(
      `SELECT * FROM context_chunks WHERE chunk_text LIKE '%${query.replace(/'/g, "''")}%' ORDER BY created_at DESC LIMIT ${limit}`
    );
    return rows.map((r) => this.rowToChunk(r));
  }

  getTotalTokens(): number {
    const r = this.queryOne("SELECT COALESCE(SUM(token_count), 0) as total FROM context_chunks");
    return r?.total || 0;
  }

  getTokensByTier(): Record<string, number> {
    const rows = this.queryAll("SELECT tier, COALESCE(SUM(token_count), 0) as total FROM context_chunks GROUP BY tier");
    const result: Record<string, number> = { hot: 0, warm: 0, cool: 0, cold: 0, total: 0 };
    for (const row of rows) {
      result[row.tier] = row.total;
      result.total += row.total;
    }
    return result;
  }

  compressChunk(id: string, summary: string, newTier: ContextChunkRow["tier"]): void {
    this.exec(`UPDATE context_chunks SET compressed = 1, summary = '${summary.replace(/'/g, "''")}', 
      tier = '${newTier}', chunk_text = '${summary.replace(/'/g, "''")}' WHERE id = '${id}'`);
  }

  // ─── Sort Weight Operations ───

  getSortWeights(): Record<string, number> {
    const rows = this.queryAll("SELECT dimension, weight FROM sort_weights");
    const weights: Record<string, number> = {};
    for (const row of rows) {
      weights[row.dimension] = row.weight;
    }
    return weights;
  }

  setSortWeight(dimension: string, weight: number): void {
    this.exec(`INSERT OR REPLACE INTO sort_weights (dimension, weight) VALUES ('${dimension}', ${weight})`);
  }

  // ─── Helpers ───

  private rowToMemory(row: any): MemoryRow {
    return {
      id: row.id,
      type: row.type,
      content: row.content,
      tags: JSON.parse(row.tags || "[]"),
      strength: row.strength,
      importance: row.importance,
      access_count: row.access_count,
      created_at: row.created_at,
      last_accessed: row.last_accessed,
      source: row.source,
      conversation_id: row.conversation_id || undefined,
      session_id: row.session_id || undefined,
      parent_id: row.parent_id || undefined,
      related_ids: JSON.parse(row.related_ids || "[]"),
    };
  }

  private rowToChunk(row: any): ContextChunkRow {
    return {
      id: row.id,
      memory_id: row.memory_id || undefined,
      chunk_text: row.chunk_text,
      token_count: row.token_count,
      tier: row.tier,
      created_at: row.created_at,
      compressed: row.compressed === 1,
      summary: row.summary || undefined,
    };
  }

  close(): void {
    try { execSync(`sqlite3 "${this.dbPath}" ".quit"`); } catch {}
  }
}
