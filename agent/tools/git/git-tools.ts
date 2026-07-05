// ============================================================
// [Q]uantelix Agent — Git Tools
// Full git workflow integration
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../../core/types";
import { execSync } from "child_process";

function git(args: string, ctx: ToolContext): string {
  return execSync(`git ${args}`, {
    cwd: ctx.workspace_dir,
    encoding: "utf-8",
    maxBuffer: 1024 * 1024,
  });
}

const gitTool = (name: string, desc: string, cmd: string, argsSchema: any): ToolDefinition => ({
  name,
  description: desc,
  category: "git",
  tags: ["git", "version-control"],
  input_schema: argsSchema,
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      let command = cmd;
      for (const [k, v] of Object.entries(args)) {
        if (v) command = command.replace(`{${k}}`, String(v));
      }
      const output = git(command, ctx);
      return { success: true, data: output || "(ok)" };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
});

export const gitStatusTool = gitTool(
  "git_status", "Show git status", "status --short",
  { type: "object", properties: {} }
);

export const gitDiffTool = gitTool(
  "git_diff", "Show git diff", "diff",
  { type: "object", properties: { path: { type: "string" } }, required: [] }
);

export const gitLogTool = gitTool(
  "git_log", "Show commit log", "log --oneline -{limit}",
  { type: "object", properties: { limit: { type: "number", default: 10 } }, required: [] }
);

export const gitCommitTool: ToolDefinition = {
  name: "git_commit",
  description: "Stage all changes and create a commit",
  category: "git",
  tags: ["git", "commit"],
  input_schema: {
    type: "object",
    properties: { message: { type: "string", description: "Commit message" } },
    required: ["message"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      git("add -A", ctx);
      const output = git(`commit -m "${args.message.replace(/"/g, '\\"')}"`, ctx);
      return { success: true, data: output };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const gitBranchTool = gitTool(
  "git_branch", "List branches", "branch",
  { type: "object", properties: {} }
);

export const gitCheckoutTool = gitTool(
  "git_checkout", "Switch branches", "checkout {branch}",
  { type: "object", properties: { branch: { type: "string" } }, required: ["branch"] }
);

export const gitPushTool = gitTool(
  "git_push", "Push to remote", "push origin {branch}",
  { type: "object", properties: { branch: { type: "string", default: "main" } }, required: [] }
);
