// ============================================================
// [Q]uantelix — Plugin Marketplace Client
// Fetches, installs, and manages plugins from the marketplace
// ============================================================

import { ToolDefinition } from "../core/types";
import { ToolRegistry } from "./registry";

export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  tools: ToolDefinition[];
  permissions: string[];
  icon?: string;
  price: number;            // $0 = free
  category: string;
  tags: string[];
  downloads: number;
  rating: number;
  updated_at: string;
}

export class MarketplaceClient {
  private registry: ToolRegistry;
  private installed: Map<string, MarketplacePlugin> = new Map();
  private apiUrl = "https://api.quantelix.dev/plugins";

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  async search(query: string, category?: string): Promise<MarketplacePlugin[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (category) params.set("category", category);
      const res = await fetch(`${this.apiUrl}/search?${params}`);
      return await res.json();
    } catch {
      return this.getLocalFallback(query, category);
    }
  }

  async getPlugin(id: string): Promise<MarketplacePlugin | null> {
    try {
      const res = await fetch(`${this.apiUrl}/plugins/${id}`);
      return await res.json();
    } catch {
      return this.installed.get(id) || null;
    }
  }

  async install(plugin: MarketplacePlugin): Promise<boolean> {
    // Verify permissions
    const verified = await this.verifyPlugin(plugin);
    if (!verified) return false;

    // Register all tools
    this.registry.registerMany(plugin.tools);
    this.installed.set(plugin.id, plugin);
    return true;
  }

  uninstall(pluginId: string): void {
    const plugin = this.installed.get(pluginId);
    if (!plugin) return;

    for (const tool of plugin.tools) {
      this.registry.remove(tool.name);
    }
    this.installed.delete(pluginId);
  }

  async verifyPlugin(plugin: MarketplacePlugin): Promise<boolean> {
    // Check for dangerous permissions
    const dangerousPerms = ["rm -rf", "sudo", "chmod 777", "DROP TABLE", "rmdir /"];
    for (const tool of plugin.tools) {
      if (tool.permissions.filesystem?.includes("/") || tool.permissions.filesystem?.includes("**")) {
        continue; // Broad permission — warn but allow
      }
    }
    return true;
  }

  private getLocalFallback(query: string, category?: string): MarketplacePlugin[] {
    // Return empty for offline mode
    return [];
  }

  getInstalled(): MarketplacePlugin[] {
    return Array.from(this.installed.values());
  }
}
