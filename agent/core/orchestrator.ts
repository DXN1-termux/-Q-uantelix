// ============================================================
// [Q]uantelix Agent Engine — Orchestrator
// Main agent loop: plan → execute → evaluate → respond
// ============================================================

import {
  ConversationMessage,
  AgentConfig,
  ToolDefinition,
  ToolOutput,
} from "./types";
import { EventBus } from "./event-bus";
import { ContextManager } from "./context-manager";
import { MemorySystem } from "./memory";
import { Planner, PlanResult } from "./planner";
import { Executor } from "./executor";
import { ToolRegistry } from "../plugins/registry";
import { LLMProvider } from "./types";

export class Orchestrator {
  public events: EventBus;
  public context: ContextManager;
  public memory: MemorySystem;
  public registry: ToolRegistry;

  private planner: Planner;
  private executor: Executor;
  private provider: LLMProvider | null = null;
  private config: AgentConfig;
  private running = false;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      max_steps: 25,
      max_tokens: 128000,
      temperature: 0.7,
      model: "gpt-4o-mini",
      provider: "openai",
      system_prompt: `You are [Q]uantelix — an autonomous AI agent. You can use tools to accomplish tasks. Think step by step.`,
      sandbox_enabled: true,
      free_tier: false,
      ...config,
    };

    this.events = new EventBus();
    this.context = new ContextManager(this.config.max_tokens);
    this.memory = new MemorySystem();
    this.registry = new ToolRegistry();
    this.planner = new Planner([], this.config);
    this.executor = new Executor(this.registry, {
      workspace_dir: "/tmp/quantelix-workspace",
    });
  }

  setProvider(provider: LLMProvider): void {
    this.provider = provider;
  }

  registerTools(tools: ToolDefinition[]): void {
    this.registry.registerMany(tools);
    this.planner.updateTools(this.registry.getAll());
  }

  async run(input: string): Promise<string> {
    if (this.running) {
      throw new Error("Agent is already running");
    }
    this.running = true;
    this.events.setState("thinking");

    try {
      // Add user message
      this.context.add({
        id: crypto.randomUUID(),
        role: "user",
        content: input,
        created_at: Date.now(),
      });

      let finalResponse = "";
      let stepCount = 0;

      while (stepCount < this.config.max_steps && this.running) {
        this.events.setState("planning");

        // Get current context and plan
        const messages = this.context.getMessages();
        const plan = await this.planner.plan(messages);

        if (plan.is_final) {
          finalResponse = plan.response || "Task complete.";
          this.context.add({
            id: crypto.randomUUID(),
            role: "assistant",
            content: finalResponse,
            created_at: Date.now(),
          });
          this.events.setState("responding");
          this.events.emit("stream_token", { token: finalResponse });
          break;
        }

        // Execute each step
        for (const step of plan.steps) {
          if (!this.running) break;
          if (!step.tool) {
            this.events.emit("plan_step", { description: step.description });
            continue;
          }

          this.events.setState("executing_tool");
          this.events.emit("tool_call", {
            name: step.tool,
            args: step.args,
            description: step.description,
          });

          const result = await this.executor.execute(
            step.tool,
            step.args || {}
          );

          this.events.emit("tool_result", {
            name: step.tool,
            result,
          });

          // Feed result back to context
          this.context.add({
            id: crypto.randomUUID(),
            role: "tool",
            content: JSON.stringify(result),
            tool_call_id: step.tool,
            name: step.tool,
            created_at: Date.now(),
          });

          this.events.setState("evaluating");
        }

        stepCount++;
      }

      this.events.setState("idle");
      this.events.emit("done", { response: finalResponse });
      return finalResponse;
    } catch (err: any) {
      this.events.setState("error");
      this.events.emit("error", { message: err.message });
      throw err;
    } finally {
      this.running = false;
    }
  }

  abort(): void {
    this.running = false;
    this.events.setState("idle");
  }

  isRunning(): boolean {
    return this.running;
  }
}
