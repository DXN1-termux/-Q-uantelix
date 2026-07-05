// ============================================================
// [Q]uantelix Agent — Utility Tools
// Common utility operations + port checking
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

// ─── Port Checker Tools ───

export const checkPortTool: ToolDefinition = {
  name: "check_port",
  description: "Check if a specific port is available or in use",
  category: "utility",
  tags: ["port", "network", "check"],
  input_schema: {
    type: "object",
    properties: {
      port: { type: "number", description: "Port number to check" },
      host: { type: "string", description: "Host to check (default: 0.0.0.0)" },
    },
    required: ["port"],
  },
  permissions: { network: true },
  async execute(args: Record<string, any>): Promise<ToolOutput> {
    const net = await import("net");
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on("error", () => {
        resolve({ success: true, data: { port: args.port, available: false, status: "IN_USE" } });
      });
      server.listen(args.port, args.host || "0.0.0.0", () => {
        server.close(() => {
          resolve({ success: true, data: { port: args.port, available: true, status: "AVAILABLE" } });
        });
      });
    });
  },
};

export const findOpenPortTool: ToolDefinition = {
  name: "find_open_port",
  description: "Find the first available port in a range",
  category: "utility",
  tags: ["port", "network", "find"],
  input_schema: {
    type: "object",
    properties: {
      start: { type: "number", description: "Start port (default: 3000)" },
      end: { type: "number", description: "End port (default: 8099)" },
    },
  },
  permissions: { network: true },
  async execute(args: Record<string, any>): Promise<ToolOutput> {
    const start = args.start || 3000;
    const end = args.end || 8099;
    const net = await import("net");

    for (let port = start; port <= end; port++) {
      const available = await new Promise<boolean>((resolve) => {
        const server = net.createServer();
        server.unref();
        server.on("error", () => resolve(false));
        server.listen(port, "0.0.0.0", () => {
          server.close(() => resolve(true));
        });
      });
      if (available) {
        return { success: true, data: { port, range: `${start}-${end}`, status: "AVAILABLE" } };
      }
    }
    return { success: true, data: { port: -1, range: `${start}-${end}`, status: "NO_PORT_AVAILABLE" } };
  },
};
