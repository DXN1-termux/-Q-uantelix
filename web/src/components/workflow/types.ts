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
  condition?: string;
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
