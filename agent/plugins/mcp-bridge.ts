// ============================================================
// [Q]uantelix Agent — MCP Bridge
// Connects to external MCP-compatible servers as tool sources
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../core/types";
import { ToolRegistry } from "./registry";

interface MCPServerConfig {
  name: string;
  url: string;
  apiKey?: string;
}

export class MCPBridge {
  private servers: MCPServerConfig[] = [];

  constructor(private registry: ToolRegistry) {}

  addServer(config: MCPServerConfig): void {
    this.servers.push(config);
  }

  removeServer(name: string): void {
    this.servers = this.servers.filter((s) => s.name !== name);
  }

  async syncAll(): Promise<void> {
    for (const server of this.servers) {
      await this.syncServer(server);
    }
  }

  private async syncServer(server: MCPServerConfig): Promise<void> {
    try {
      const res = await fetch(`${server.url}/tools`, {
        headers: server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {},
      });
      if (!res.ok) return;

      const tools: any[] = await res.json();
      for (const tool of tools) {
        const mcpTool: ToolDefinition = {
          name: `${server.name}_${tool.name}`,
          description: tool.description || `MCP tool from ${server.name}`,
          category: "mcp",
          tags: ["mcp", server.name],
          input_schema: tool.inputSchema || {},
          permissions: { network: true },
          async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
            const res = await fetch(`${server.url}/execute`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {}),
              },
              body: JSON.stringify({ name: tool.name, arguments: args }),
            });
            const data = await res.json();
            return { success: res.ok, data };
          },
        };
        this.registry.register(mcpTool);
      }
    } catch {
      // Server unreachable, skip
    }
  }
}
