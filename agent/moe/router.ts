// ============================================================
// [Q]uantelix — MoE Router
// Analyses tasks, routes to experts, spawns sub-agents
// ============================================================

import { ExpertType, ExpertAgent, MoETask, MoERoute, SubAgentConfig, SubAgentResult } from "./types";
import { ExpertRegistry } from "./expert-registry";
import { Coordinator } from "./coordinator";
import { SubAgent } from "./sub-agent";
import { MemoryBus } from "./memory-bus";
import { ToolRegistry } from "../plugins/registry";
import { EventBus } from "../core/event-bus";

export class MoERouter {
  public events: EventBus;
  public coordinator: Coordinator;
  public memoryBus: MemoryBus;

  private registry: ExpertRegistry;
  private toolRegistry: ToolRegistry;
  private activeSubAgents: Map<string, SubAgent> = new Map();

  constructor(registry: ExpertRegistry, toolRegistry: ToolRegistry) {
    this.registry = registry;
    this.toolRegistry = toolRegistry;
    this.events = new EventBus();
    this.memoryBus = new MemoryBus();
    this.coordinator = new Coordinator(this.memoryBus);
  }

  route(instruction: string): MoERoute {
    const lower = instruction.toLowerCase();

    // Detect primary expert based on keywords
    let primary: ExpertType = "planner";
    const supporting: Set<ExpertType> = new Set();

    // Code-related
    if (/(write|create|implement|code|function|class|refactor|debug|fix|build)/i.test(lower)) {
      primary = "coder";
      supporting.add("tester");
      if (/(deploy|docker|ci|cd|release)/i.test(lower)) supporting.add("devops");
    }

    // Research-related
    if (/(search|research|find|look up|documentation|docs|learn|what is|how does)/i.test(lower)) {
      if (primary === "planner") primary = "researcher";
      else supporting.add("researcher");
    }

    // Devops-related
    if (/(deploy|docker|container|kubernetes|k8s|infrastructure|server|cloud)/i.test(lower)) {
      if (primary === "planner") primary = "devops";
      else supporting.add("devops");
    }

    // Data-related
    if (/(database|sql|query|data|analytics|table|schema|migration)/i.test(lower)) {
      if (primary === "planner") primary = "data";
      else supporting.add("data");
    }

    // Complex tasks always involve planner
    if (/(complex|multi-step|project|system|architecture|workflow)/i.test(lower)) {
      supporting.add("planner");
    }

    // Always include reviewer for code tasks
    if (primary === "coder" || supporting.has("coder")) {
      supporting.add("reviewer");
    }

    return {
      primary,
      supporting: Array.from(supporting),
      confidence: 0.85,
      reasoning: `Routed to ${primary} based on task keywords, supported by ${Array.from(supporting).join(", ") || "none"}`,
    };
  }

  async executeTask(instruction: string, context: string[]): Promise<SubAgentResult> {
    const route = this.route(instruction);
    this.events.emit("plan_step", { type: "route", route });

    // Create the main task
    const mainTask: MoETask = {
      id: `task_${Date.now()}`,
      type: route.primary,
      instruction,
      context,
      tools_allowed: this.registry.getToolsFor(route.primary),
      dependencies: [],
      status: "running",
      sub_tasks: [],
      created_at: Date.now(),
    };

    // Gather sub-tasks from supporting experts
    const allResults = new Map<string, SubAgentResult>();

    // Spawn primary expert
    const primaryResult = await this.spawnSubAgent(mainTask, route.primary, instruction);
    if (primaryResult) allResults.set(primaryResult.agent_id, primaryResult);

    // Spawn supporting experts in parallel
    const supportPromises = route.supporting.map(async (expertType) => {
      const supportTask: MoETask = {
        ...mainTask,
        id: `sub_${expertType}_${Date.now()}`,
        type: expertType,
        instruction: `Support the primary task: ${instruction}`,
        parent_id: mainTask.id,
        status: "running",
        sub_tasks: [],
        created_at: Date.now(),
      };
      return this.spawnSubAgent(supportTask, expertType, `[Supporting role] ${instruction}`);
    });

    const supportResults = await Promise.allSettled(supportPromises);
    for (const result of supportResults) {
      if (result.status === "fulfilled" && result.value) {
        allResults.set(result.value.agent_id, result.value);
      }
    }

    // Coordinate results
    mainTask.status = "completed";
    mainTask.completed_at = Date.now();

    const mergedOutput = await this.coordinator.coordinate(mainTask, allResults);

    return {
      agent_id: "moe_router",
      task_id: mainTask.id,
      success: true,
      output: mergedOutput,
      steps_taken: Array.from(allResults.values()).reduce((s, r) => s + r.steps_taken, 0),
      tokens_used: Array.from(allResults.values()).reduce((s, r) => s + r.tokens_used, 0),
      duration_ms: Date.now() - mainTask.created_at,
      sub_results: Array.from(allResults.values()),
    };
  }

  private async spawnSubAgent(task: MoETask, expertType: ExpertType, instruction: string): Promise<SubAgentResult | null> {
    const expert = this.registry.get(expertType);
    if (!expert) return null;

    const config: SubAgentConfig = {
      id: `agent_${expertType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      task,
      context: task.context.join("\n"),
      tools: expert.tools,
      model: expert.model,
      temperature: expert.temperature,
      max_steps: expert.max_sub_agents,
      parent_id: "moe_router",
      memory_bus_id: "main",
    };

    const subAgent = new SubAgent(config, this.toolRegistry);
    this.activeSubAgents.set(config.id, subAgent);

    // Task-specific instruction
    this.memoryBus.publish({
      from_agent: "router",
      to_agent: config.id,
      type: "context",
      content: instruction,
      timestamp: Date.now(),
      task_id: task.id,
    });

    const result = await subAgent.execute();
    this.activeSubAgents.delete(config.id);
    return result;
  }

  abortAll(): void {
    for (const [id, agent] of this.activeSubAgents) {
      agent.abort();
      this.activeSubAgents.delete(id);
    }
  }

  getActiveCount(): number {
    return this.activeSubAgents.size;
  }
}
