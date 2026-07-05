// ============================================================
// [Q]uantelix Agent — Utility Tools
// Common utility operations
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../../core/types";

export const nowTool: ToolDefinition = {
  name: "now",
  description: "Get the current date and time",
  category: "utility",
  tags: ["time", "date", "utility"],
  input_schema: { type: "object", properties: {} },
  permissions: {},
  async execute(): Promise<ToolOutput> {
    return { success: true, data: new Date().toISOString() };
  },
};

export const uuidTool: ToolDefinition = {
  name: "uuid",
  description: "Generate a UUID v4",
  category: "utility",
  tags: ["uuid", "id", "utility"],
  input_schema: { type: "object", properties: {} },
  permissions: {},
  async execute(): Promise<ToolOutput> {
    return { success: true, data: crypto.randomUUID() };
  },
};

export const readJsonTool: ToolDefinition = {
  name: "read_json",
  description: "Read and parse a JSON file",
  category: "utility",
  tags: ["json", "file", "data"],
  input_schema: {
    type: "object",
    properties: { file_path: { type: "string", description: "Path to JSON file" } },
    required: ["file_path"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const content = await fs.readFile(path.resolve(ctx.workspace_dir, args.file_path), "utf-8");
      return { success: true, data: JSON.parse(content) };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const writeJsonTool: ToolDefinition = {
  name: "write_json",
  description: "Write data as JSON to a file",
  category: "utility",
  tags: ["json", "file", "data"],
  input_schema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "Path to JSON file" },
      data: { type: "object", description: "Data to write" },
    },
    required: ["file_path", "data"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const filePath = path.resolve(ctx.workspace_dir, args.file_path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(args.data, null, 2), "utf-8");
      return { success: true, data: `JSON written to ${args.file_path}` };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const base64EncodeTool: ToolDefinition = {
  name: "base64_encode",
  description: "Encode text to base64",
  category: "utility",
  tags: ["base64", "encode"],
  input_schema: {
    type: "object",
    properties: { text: { type: "string" } },
    required: ["text"],
  },
  permissions: {},
  async execute(args: Record<string, any>): Promise<ToolOutput> {
    return { success: true, data: Buffer.from(args.text).toString("base64") };
  },
};

export const base64DecodeTool: ToolDefinition = {
  name: "base64_decode",
  description: "Decode base64 to text",
  category: "utility",
  tags: ["base64", "decode"],
  input_schema: {
    type: "object",
    properties: { encoded: { type: "string" } },
    required: ["encoded"],
  },
  permissions: {},
  async execute(args: Record<string, any>): Promise<ToolOutput> {
    return { success: true, data: Buffer.from(args.encoded, "base64").toString("utf-8") };
  },
};
