// ============================================================
// [Q]uantelix Agent — Docker Tools
// Container management
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "../../core/types";
import { execSync } from "child_process";

function docker(args: string, ctx: ToolContext): string {
  return execSync(`docker ${args}`, {
    cwd: ctx.workspace_dir,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

export const dockerPsTool: ToolDefinition = {
  name: "docker_ps",
  description: "List running Docker containers",
  category: "docker",
  tags: ["docker", "container", "list"],
  input_schema: { type: "object", properties: { all: { type: "boolean", description: "Show all containers" } } },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const flag = args.all ? "-a" : "";
      return { success: true, data: docker(`ps ${flag} --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}\\t{{.Image}}"`, ctx) };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const dockerExecTool: ToolDefinition = {
  name: "docker_exec",
  description: "Run a command in a Docker container",
  category: "docker",
  tags: ["docker", "exec", "command"],
  input_schema: {
    type: "object",
    properties: {
      container: { type: "string", description: "Container name or ID" },
      command: { type: "string", description: "Command to run" },
    },
    required: ["container", "command"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      return { success: true, data: docker(`exec ${args.container} ${args.command}`, ctx) };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const dockerComposeUpTool: ToolDefinition = {
  name: "docker_compose_up",
  description: "Start Docker Compose services",
  category: "docker",
  tags: ["docker", "compose", "up"],
  input_schema: {
    type: "object",
    properties: {
      file: { type: "string", description: "Compose file path" },
      detached: { type: "boolean", default: true },
    },
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const fileFlag = args.file ? `-f ${args.file}` : "";
      const detach = args.detached !== false ? "-d" : "";
      return { success: true, data: docker(`compose ${fileFlag} up ${detach}`, ctx) };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};

export const dockerBuildTool: ToolDefinition = {
  name: "docker_build",
  description: "Build a Docker image",
  category: "docker",
  tags: ["docker", "build", "image"],
  input_schema: {
    type: "object",
    properties: {
      tag: { type: "string", description: "Image tag (name:version)" },
      path: { type: "string", description: "Build context path" },
    },
    required: ["tag"],
  },
  permissions: { filesystem: ["**"] },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    try {
      const buildPath = args.path || ctx.workspace_dir;
      return { success: true, data: docker(`build -t ${args.tag} ${buildPath}`, ctx) };
    } catch (err: any) {
      return { success: false, data: null, error: err.message };
    }
  },
};
