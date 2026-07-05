// ============================================================
// [Q]uantelix Agent Engine — Memory System
// Ephemeral (in-conversation) + Persistent (cross-session KV)
// ============================================================

export interface MemoryEntry {
  key: string;
  value: string;
  tags: string[];
  created_at: number;
  updated_at: number;
}

export class MemorySystem {
  private store: Map<string, MemoryEntry> = new Map();

  async remember(key: string, value: string, tags: string[] = []): Promise<void> {
    const existing = this.store.get(key);
    this.store.set(key, {
      key,
      value,
      tags,
      created_at: existing?.created_at ?? Date.now(),
      updated_at: Date.now(),
    });
  }

  async recall(key: string): Promise<string | null> {
    return this.store.get(key)?.value ?? null;
  }

  async search(query: string, tag?: string): Promise<MemoryEntry[]> {
    const q = query.toLowerCase();
    return Array.from(this.store.values()).filter(
      (e) =>
        (e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q)) &&
        (!tag || e.tags.includes(tag))
    );
  }

  async forget(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(tag?: string): Promise<MemoryEntry[]> {
    const all = Array.from(this.store.values());
    return tag ? all.filter((e) => e.tags.includes(tag)) : all;
  }

  clear(): void {
    this.store.clear();
  }

  serialize(): string {
    return JSON.stringify(Array.from(this.store.entries()));
  }

  deserialize(data: string): void {
    this.store = new Map(JSON.parse(data));
  }
}
