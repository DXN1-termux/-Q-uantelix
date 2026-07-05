// ============================================================
// [Q]uantelix Agent Engine — Tool Registry
// Central catalog of all tools, supports dynamic loading
// ============================================================

import { ToolDefinition } from "../core/types";

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private categories: Map<string, Set<string>> = new Map();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    if (!this.categories.has(tool.category)) {
      this.categories.set(tool.category, new Set());
    }
    this.categories.get(tool.category)!.add(tool.name);
  }

  registerMany(tools: ToolDefinition[]): void {
    tools.forEach((t) => this.register(t));
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  search(query: string): ToolDefinition[] {
    const q = query.toLowerCase();
    return Array.from(this.tools.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  listByCategory(category: string): ToolDefinition[] {
    const names = this.categories.get(category);
    if (!names) return [];
    return Array.from(names)
      .map((n) => this.tools.get(n)!)
      .filter(Boolean);
  }

  allCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  remove(name: string): void {
    const tool = this.tools.get(name);
    if (tool) {
      this.categories.get(tool.category)?.delete(name);
      this.tools.delete(name);
    }
  }

  count(): number {
    return this.tools.size;
  }
}
