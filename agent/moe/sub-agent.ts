// ============================================================
// [Q]uantelix — Sub-Agent
// Lightweight agent spawned per sub-task
// ============================================================

import { SubAgentConfig, SubAgentResult, MemoryBusMessage } from "./types";
import { ToolRegistry } from "../plugins/registry";
import { EventBus } from "../core/event-bus";
import { TokenCounter } from "../core/token-counter";

export class SubAgent {
  public id: string;
  public events: EventBus;

  private config: SubAgentConfig;
  private registry: ToolRegistry;
  private tokenCounter: TokenCounter;

  constructor(config: SubAgentConfig, registry: ToolRegistry) {
    this.id = config.id;
    this.config = config;
    this.registry = registry;
    this.events = new EventBus();
    this.tokenCounter = new TokenCounter();
  }

  async execute(): Promise<SubAgentResult> {
    const startTime = Date.now();
    this.events.setState("thinking");

    // Publish start to memory bus
    if (this.config.memory_bus_id) {
      // Injected memory bus reference
    }

    try {
      let stepsTaken = 0;
      let output = "";
      let tokensUsed = 0;

      // Run sub-agent loop (simplified — in production calls LLM)
      for (let i = 0; i < this.config.max_steps; i++) {
        this.events.setState("planning");
        tokensUsed += this.tokenCounter.count(this.config.context);

        // Determine which tools to use based on task
        this.events.setState("executing_tool");

        // Execute relevant tools
        const relevantTools = this.registry.search(this.config.task.instruction);
        for (const tool of relevantTools.slice(0, 3)) {
          if (!this.config.tools_allowed.includes(tool.name)) continue;

          this.events.emit("tool_call", {
            name: tool.name,
            task_id: this.config.task.id,
            agent_id: this.id,
          });

          // Tool execution happens here
          tokensUsed += 100;
          stepsTaken++;

          this.events.emit("tool_result", {
            name: tool.name,
            status: "completed",
          });
        }

        output = `Processed task: ${this.config.task.instruction}`;
        break;
      }

      this.events.setState("idle");

      return {
        agent_id: this.id,
        task_id: this.config.task.id,
        success: true,
        output,
        steps_taken: stepsTaken,
        tokens_used: tokensUsed,
        duration_ms: Date.now() - startTime,
        sub_results: [],
      };
    } catch (err: any) {
      this.events.setState("error");
      return {
        agent_id: this.id,
        task_id: this.config.task.id,
        success: false,
        output: "",
        steps_taken: 0,
        tokens_used: 0,
        duration_ms: Date.now() - startTime,
        error: err.message,
        sub_results: [],
      };
    }
  }

  abort(): void {
    this.events.setState("idle");
  }
}
