// ============================================================
// [Q]uantelix Agent — Terminal Tools
// Command execution in sandboxed environment
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../../core/types";
import { execSync, spawn } from "child_process";

export const executeCommandTool: ToolDefinition = {
  name: "execute_command",
  description: "Run a shell command and get its output",
  category: "terminal",
  tags: ["shell", "command", "terminal"],
  input_schema: {
    type: "object",
    properties: {
      command: { type: "string", description: "Shell command to run" },
      timeout: { type: "number", description: "Timeout in ms", default: 30000 },
      workdir: { type: "string", description: "Working directory" },
    },
    required: ["command"],
  },
  permissions: { filesystem: ["**"], network: true },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const output = execSync(args.command, {
        cwd: args.workdir || ctx.workspace_dir,
        timeout: args.timeout || 30000,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, ...ctx.env },
      });
      return { success: true, data: output || "(command completed with no output)" };
    } catch (err: any) {
      return {
        success: false,
        data: err.stdout || "",
        error: err.stderr || err.message || "Command failed",
      };
    }
  },
};

export const executeScriptTool: ToolDefinition = {
  name: "execute_script",
  description: "Run a multi-line script in the specified language",
  category: "terminal",
  tags: ["script", "run", "code"],
  input_schema: {
    type: "object",
    properties: {
      language: {
        type: "string",
        description: "Script language (bash, python, node)",
        enum: ["bash", "python", "node"],
      },
      code: { type: "string", description: "Script content" },
      timeout: { type: "number", description: "Timeout in ms", default: 30000 },
    },
    required: ["language", "code"],
  },
  permissions: { filesystem: ["**"], network: true },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    const runners: Record<string, string> = {
      bash: "/bin/bash",
      python: "/usr/bin/python3",
      node: "/usr/bin/node",
    };
    const runner = runners[args.language];
    if (!runner) {
      return { success: false, data: null, error: `Unsupported language: ${args.language}` };
    }
    try {
      const output = execSync(runner, {
        input: args.code,
        timeout: args.timeout || 30000,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
        cwd: ctx.workspace_dir,
      });
      return { success: true, data: output || "(script completed with no output)" };
    } catch (err: any) {
      return {
        success: false,
        data: err.stdout || "",
        error: err.stderr || err.message || "Script failed",
      };
    }
  },
};
