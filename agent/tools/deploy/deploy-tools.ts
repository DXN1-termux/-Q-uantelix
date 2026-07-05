// ============================================================
// [Q]uantelix Agent — Deploy Tools
// Vercel, Netlify, Cloudflare deployment
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../../core/types";
import { execSync } from "child_process";

export const deployVercelTool: ToolDefinition = {
  name: "deploy_vercel",
  description: "Deploy to Vercel",
  category: "deploy",
  tags: ["deploy", "vercel", "hosting"],
  input_schema: {
    type: "object",
    properties: {
      prod: { type: "boolean", description: "Deploy to production" },
      name: { type: "string", description: "Project name" },
    },
  },
  permissions: { filesystem: ["**"], network: true },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const prodFlag = args.prod ? "--prod" : "";
      const nameFlag = args.name ? `--name ${args.name}` : "";
      const output = execSync(`npx vercel ${prodFlag} ${nameFlag} --yes`, {
        cwd: ctx.workspace_dir,
        encoding: "utf-8",
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });
      return { success: true, data: output };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const deployNetlifyTool: ToolDefinition = {
  name: "deploy_netlify",
  description: "Deploy to Netlify",
  category: "deploy",
  tags: ["deploy", "netlify", "hosting"],
  input_schema: {
    type: "object",
    properties: {
      dir: { type: "string", description: "Directory to deploy" },
      prod: { type: "boolean", description: "Deploy to production" },
    },
  },
  permissions: { filesystem: ["**"], network: true },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const dir = args.dir || ctx.workspace_dir;
      const prodFlag = args.prod ? "--prod" : "";
      const output = execSync(`npx netlify-cli deploy ${prodFlag} --dir=${dir}`, {
        cwd: ctx.workspace_dir,
        encoding: "utf-8",
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });
      return { success: true, data: output };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};
