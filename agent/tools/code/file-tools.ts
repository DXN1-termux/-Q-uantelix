// ============================================================
// [Q]uantelix Agent — Code Tools
// File read, write, edit, search operations
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../../core/types";
import * as fs from "fs/promises";
import * as path from "path";

export const readFileTool: ToolDefinition = {
  name: "read_file",
  description: "Read the contents of a file",
  category: "code",
  tags: ["file", "read", "code"],
  input_schema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "Path to the file" },
      max_length: { type: "number", description: "Max characters to read" },
    },
    required: ["file_path"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const filePath = path.resolve(ctx.workspace_dir, args.file_path);
      let content = await fs.readFile(filePath, "utf-8");
      if (args.max_length && content.length > args.max_length) {
        content = content.slice(0, args.max_length) + "\n... (truncated)";
      }
      return { success: true, data: content, mime_type: "text/plain" };
    } catch (err: any) {
      return { success: false, data: null, error: `Failed to read file: ${err.message}` };
    }
  },
};

export const writeFileTool: ToolDefinition = {
  name: "write_file",
  description: "Create or overwrite a file with content",
  category: "code",
  tags: ["file", "write", "code"],
  input_schema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "Path to the file" },
      content: { type: "string", description: "Content to write" },
    },
    required: ["file_path", "content"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const filePath = path.resolve(ctx.workspace_dir, args.file_path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, args.content, "utf-8");
      return { success: true, data: `File written: ${args.file_path}` };
    } catch (err: any) {
      return { success: false, data: null, error: `Failed to write file: ${err.message}` };
    }
  },
};

export const editFileTool: ToolDefinition = {
  name: "edit_file",
  description: "Apply a targeted edit (replace text) in a file",
  category: "code",
  tags: ["file", "edit", "code"],
  input_schema: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "Path to the file" },
      old_text: { type: "string", description: "Text to find and replace" },
      new_text: { type: "string", description: "Replacement text" },
    },
    required: ["file_path", "old_text", "new_text"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const filePath = path.resolve(ctx.workspace_dir, args.file_path);
      let content = await fs.readFile(filePath, "utf-8");
      if (!content.includes(args.old_text)) {
        return { success: false, data: null, error: "old_text not found in file" };
      }
      content = content.replace(args.old_text, args.new_text);
      await fs.writeFile(filePath, content, "utf-8");
      return { success: true, data: "File edited successfully" };
    } catch (err: any) {
      return { success: false, data: null, error: `Failed to edit file: ${err.message}` };
    }
  },
};

export const searchCodeTool: ToolDefinition = {
  name: "search_code",
  description: "Search codebase using ripgrep-like pattern matching",
  category: "code",
  tags: ["search", "code", "grep"],
  input_schema: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Search pattern" },
      path: { type: "string", description: "Subdirectory to search" },
      max_results: { type: "number", description: "Max results" },
    },
    required: ["pattern"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const { execSync } = require("child_process");
      const searchPath = args.path ? path.resolve(ctx.workspace_dir, args.path) : ctx.workspace_dir;
      const result = execSync(
        `rg --no-heading -n "${args.pattern}" "${searchPath}" 2>/dev/null | head -${args.max_results || 50}`,
        { encoding: "utf-8", maxBuffer: 1024 * 1024 }
      );
      return { success: true, data: result || "No matches found." };
    } catch {
      return { success: true, data: "No matches found." };
    }
  },
};

export const listDirectoryTool: ToolDefinition = {
  name: "list_directory",
  description: "List files and directories in a path",
  category: "code",
  tags: ["file", "directory", "list"],
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory path", default: "." },
      depth: { type: "number", description: "Max depth" },
    },
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const dirPath = path.resolve(ctx.workspace_dir, args.path || ".");
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const listing = entries.map((e) => {
        const stats = fs.stat(path.join(dirPath, e.name));
        return `${e.isDirectory() ? "📁" : "📄"} ${e.name}`;
      });
      return { success: true, data: listing.join("\n") };
    } catch (err: any) {
      return { success: false, data: null, error: `Failed to list directory: ${err.message}` };
    }
  },
};
