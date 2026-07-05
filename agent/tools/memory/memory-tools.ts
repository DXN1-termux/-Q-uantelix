// ============================================================
// [Q]uantelix Agent — Memory Tools
// Persist and recall cross-session context
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../../core/types";
import { MemorySystem } from "../../core/memory";

export function createMemoryTools(memory: MemorySystem): ToolDefinition[] {
  return [
    {
      name: "remember",
      description: "Save information to persistent memory for later recall",
      category: "memory",
      tags: ["memory", "store", "persist"],
      input_schema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Memory key/identifier" },
          value: { type: "string", description: "Content to remember" },
          tags: { type: "array", items: { type: "string" }, description: "Tags for organization" },
        },
        required: ["key", "value"],
      },
      permissions: {},
      async execute(args: Record<string, any>): Promise<ToolOutput> {
        await memory.remember(args.key, args.value, args.tags || []);
        return { success: true, data: `Remembered: ${args.key}` };
      },
    },
    {
      name: "recall",
      description: "Retrieve information from persistent memory",
      category: "memory",
      tags: ["memory", "recall", "search"],
      input_schema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Memory key to recall" },
          query: { type: "string", description: "Search query" },
          tag: { type: "string", description: "Filter by tag" },
        },
      },
      permissions: {},
      async execute(args: Record<string, any>): Promise<ToolOutput> {
        if (args.key) {
          const val = await memory.recall(args.key);
          return { success: true, data: val || "Nothing found for that key." };
        }
        if (args.query) {
          const results = await memory.search(args.query, args.tag);
          if (results.length === 0) return { success: true, data: "No matching memories." };
          return {
            success: true,
            data: results.map((r) => `[${r.key}] ${r.value.slice(0, 200)}`).join("\n"),
          };
        }
        const all = await memory.list(args.tag);
        return { success: true, data: all.map((r) => r.key).join("\n") || "No memories stored." };
      },
    },
    {
      name: "forget",
      description: "Remove a memory by key",
      category: "memory",
      tags: ["memory", "delete"],
      input_schema: {
        type: "object",
        properties: { key: { type: "string", description: "Memory key to forget" } },
        required: ["key"],
      },
      permissions: {},
      async execute(args: Record<string, any>): Promise<ToolOutput> {
        await memory.forget(args.key);
        return { success: true, data: `Forgot: ${args.key}` };
      },
    },
  ];
}
