// ============================================================
// [Q]uantelix — Workflow Interpreter
// Executes visual workflow graphs with branching and loops
// ============================================================

import { ToolRegistry } from "../plugins/registry";

export interface WorkflowNode {
  id: string;
  type: "action" | "agent" | "condition" | "loop" | "human_input" | "parallel" | "merge" | "start" | "end";
  label: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string; // JavaScript expression to evaluate
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: number;
  updated_at: number;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: "running" | "completed" | "failed" | "paused";
  current_node_id: string | null;
  node_results: Map<string, any>;
  error?: string;
  started_at: number;
  completed_at?: number;
}

export class WorkflowInterpreter {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  async execute(workflow: WorkflowDefinition, inputs: Record<string, any> = {}): Promise<WorkflowRun> {
    const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));
    const edgeMap = new Map<string, WorkflowEdge[]>();
    for (const edge of workflow.edges) {
      if (!edgeMap.has(edge.from)) edgeMap.set(edge.from, []);
      edgeMap.get(edge.from)!.push(edge);
    }

    const run: WorkflowRun = {
      id: `wf_run_${Date.now()}`,
      workflow_id: workflow.id,
      status: "running",
      current_node_id: null,
      node_results: new Map(),
      started_at: Date.now(),
    };

    const context: Record<string, any> = { ...inputs };

    // Find start node
    const startNode = workflow.nodes.find((n) => n.type === "start");
    if (!startNode) {
      run.status = "failed";
      run.error = "No start node found";
      return run;
    }

    try {
      await this.traverse(startNode.id, nodeMap, edgeMap, context, run);
      run.status = "completed";
      run.completed_at = Date.now();
    } catch (err: any) {
      run.status = "failed";
      run.error = err.message;
      run.completed_at = Date.now();
    }

    return run;
  }

  private async traverse(
    nodeId: string,
    nodeMap: Map<string, WorkflowNode>,
    edgeMap: Map<string, WorkflowEdge[]>,
    context: Record<string, any>,
    run: WorkflowRun
  ): Promise<void> {
    const node = nodeMap.get(nodeId);
    if (!node || node.type === "end") return;

    run.current_node_id = nodeId;

    switch (node.type) {
      case "action": {
        const tool = this.registry.get(node.config.tool_name);
        if (tool) {
          const result = await tool.execute(node.config.args || {}, {
            workspace_dir: "/tmp/quantelix-workflow",
            env: {},
            permissions: [],
            abort_signal: new AbortController().signal,
          });
          run.node_results.set(nodeId, result);
          context[`${node.id}_result`] = result;
        }
        break;
      }
      case "condition": {
        const expr = node.config.expression || "true";
        try {
          const result = Function('"use strict"; return (' + expr + ')').call(context);
          run.node_results.set(nodeId, { condition_met: result });
          const edges = edgeMap.get(nodeId) || [];
          const nextEdge = result
            ? edges.find((e) => e.label === "true" || !e.condition)
            : edges.find((e) => e.label === "false");
          if (nextEdge) {
            await this.traverse(nextEdge.to, nodeMap, edgeMap, context, run);
          }
        } catch (err: any) {
          context[`${node.id}_error`] = err.message;
        }
        return; // Don't take default edge
      }
      case "human_input": {
        // Pause for human input — stored in context
        run.status = "paused";
        return;
      }
      case "parallel": {
        const edges = edgeMap.get(nodeId) || [];
        await Promise.all(edges.map((edge) => this.traverse(edge.to, nodeMap, edgeMap, context, run)));
        return;
      }
      case "loop": {
        const iterable = context[node.config.iterate_over] || [];
        for (const item of iterable) {
          context.loop_item = item;
          context.loop_index = iterable.indexOf(item);
          const edges = edgeMap.get(nodeId) || [];
          for (const edge of edges) {
            await this.traverse(edge.to, nodeMap, edgeMap, context, run);
          }
        }
        return;
      }
      case "agent": {
        // Spawn a sub-agent for this node
        run.node_results.set(nodeId, { status: "spawned", config: node.config });
        break;
      }
    }

    // Take default outgoing edge
    const edges = edgeMap.get(nodeId) || [];
    const defaultEdge = edges.find((e) => !e.condition && e.label !== "false");
    if (defaultEdge) {
      await this.traverse(defaultEdge.to, nodeMap, edgeMap, context, run);
    }
  }
}
