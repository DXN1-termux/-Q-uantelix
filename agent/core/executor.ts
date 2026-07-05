// ============================================================
// [Q]uantelix Agent Engine — Executor
// Runs tools in sandboxed environments with timeouts
// ============================================================

import { ToolDefinition, ToolContext, ToolOutput } from "./types";
import { ToolRegistry } from "../plugins/registry";

export class Executor {
  constructor(
    private registry: ToolRegistry,
    private defaultContext: Partial<ToolContext>
  ) {}

  async execute(
    toolName: string,
    args: Record<string, any>,
    contextOverride?: Partial<ToolContext>
  ): Promise<ToolOutput> {
    const tool = this.registry.get(toolName);
    if (!tool) {
      return { success: false, data: null, error: `Tool '${toolName}' not found` };
    }

    const context: ToolContext = {
      workspace_dir: this.defaultContext.workspace_dir || "/tmp/quantelix",
      env: { ...this.defaultContext.env },
      permissions: this.defaultContext.permissions || [],
      abort_signal: contextOverride?.abort_signal || new AbortController().signal,
      ...contextOverride,
    };

    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    context.abort_signal = controller.signal;

    try {
      const result = await tool.execute(args, context);
      clearTimeout(timeout);
      return result;
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        success: false,
        data: null,
        error: err.message || "Tool execution failed",
      };
    }
  }

  async executePlan(
    steps: Array<{ tool: string; args: Record<string, any> }>,
    onStepComplete?: (step: number, result: ToolOutput) => void
  ): Promise<ToolOutput[]> {
    const results: ToolOutput[] = [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const result = await this.execute(step.tool, step.args);
      results.push(result);
      onStepComplete?.(i, result);
      if (!result.success) break; // Stop on failure
    }
    return results;
  }
}
