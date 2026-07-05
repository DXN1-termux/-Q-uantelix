// ============================================================
// [Q]uantelix Agent — Web Tools
// Web search, fetch, and browsing capabilities
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../../core/types";

export const webSearchTool: ToolDefinition = {
  name: "web_search",
  description: "Search the web for information",
  category: "web",
  tags: ["web", "search", "internet"],
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      max_results: { type: "number", default: 5 },
    },
    required: ["query"],
  },
  permissions: { network: true },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const q = encodeURIComponent(args.query);
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}`);
      const html = await res.text();
      const snippets = html.match(/<a[^>]+class="result__a[^>]*>([^<]+)<\/a>/g)?.slice(0, args.max_results || 5) || [];
      return {
        success: true,
        data: snippets.map((s: string) => s.replace(/<[^>]+>/g, "")).join("\n") || "No results found",
      };
    } catch (err: any) {
      return { success: true, data: "Web search unavailable (offline or blocked)" };
    }
  },
};

export const readUrlTool: ToolDefinition = {
  name: "read_url",
  description: "Fetch and read the content of a URL",
  category: "web",
  tags: ["web", "fetch", "url"],
  input_schema: {
    type: "object",
    properties: {
      url: { type: "string", description: "URL to fetch" },
      max_length: { type: "number", default: 10000 },
    },
    required: ["url"],
  },
  permissions: { network: true },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const res = await fetch(args.url);
      const text = await res.text();
      const content = text.slice(0, args.max_length || 10000);
      return { success: true, data: content, mime_type: "text/html" };
    } catch (err: any) {
      return { success: false, data: null, error: `Failed to fetch URL: ${err.message}` };
    }
  },
};
