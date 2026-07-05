// ============================================================
// [Q]uantelix — MoE Coordinator
// Coordinates sub-agents, merges results, handles conflicts
// ============================================================

import { MoETask, SubAgentResult } from "./types";
import { MemoryBus } from "./memory-bus";

export class Coordinator {
  private memoryBus: MemoryBus;

  constructor(memoryBus: MemoryBus) {
    this.memoryBus = memoryBus;
  }

  async coordinate(task: MoETask, results: Map<string, SubAgentResult>): Promise<string> {
    // Gather results from all sub-tasks
    const completed: SubAgentResult[] = [];
    const failed: SubAgentResult[] = [];

    for (const [agentId, result] of results) {
      if (result.success) {
        completed.push(result);
      } else {
        failed.push(result);
      }
    }

    // If there are failures, try to recover
    for (const fail of failed) {
      const originalTask = task.sub_tasks.find((t) => t.id === fail.task_id);
      if (originalTask && fail.steps_taken > 0) {
        // Partial result — salvage what we can
        completed.push(fail);
      }
    }

    // Merge results into coherent output
    const merged = this.mergeResults(completed, task);

    // Broadcast completion to memory bus
    this.memoryBus.publish({
      from_agent: "coordinator",
      type: "result",
      content: `Coordinated ${completed.length} sub-tasks for task ${task.id}`,
      timestamp: Date.now(),
      task_id: task.id,
    });

    return merged;
  }

  private mergeResults(results: SubAgentResult[], parentTask: MoETask): string {
    if (results.length === 0) return "No sub-agents completed their tasks.";

    const sections: string[] = [];

    // Organize by task type
    for (const result of results) {
      const task = parentTask.sub_tasks.find((t) => t.id === result.task_id);
      const header = task ? `## ${task.type}: ${task.instruction}` : `## Task: ${result.task_id}`;
      sections.push(`${header}\n\n${result.output}\n`);
    }

    // Add summary
    const successful = results.filter((r) => r.success).length;
    const total = results.length;
    const totalTokens = results.reduce((sum, r) => sum + r.tokens_used, 0);
    const totalTime = results.reduce((sum, r) => sum + r.duration_ms, 0);

    sections.push(
      `---\n**Summary**: ${successful}/${total} sub-tasks completed | ` +
      `${(totalTokens / 1000).toFixed(1)}K tokens used | ` +
      `${(totalTime / 1000).toFixed(1)}s total execution time`
    );

    return sections.join("\n\n");
  }

  detectConflicts(results: SubAgentResult[]): Array<{ agent1: string; agent2: string; conflict: string }> {
    const conflicts: Array<{ agent1: string; agent2: string; conflict: string }> = [];
    // Conflict detection logic — compares outputs for contradictory statements
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const a = results[i];
        const b = results[j];
        if (a.success && b.success) {
          // Simple conflict check — opposite assertions
          const wordsA = new Set(a.output.toLowerCase().split(/\s+/));
          const wordsB = new Set(b.output.toLowerCase().split(/\s+/));
          if (wordsA.has("true") && wordsB.has("false")) {
            conflicts.push({ agent1: a.agent_id, agent2: b.agent_id, conflict: "Contradictory boolean results" });
          }
        }
      }
    }
    return conflicts;
  }
}
