// ============================================================
// [Q]uantelix — MoE Types (Mixture of Experts)
// ============================================================

export type ExpertType = "planner" | "coder" | "researcher" | "devops" | "data" | "tester" | "writer" | "reviewer";

export interface ExpertAgent {
  type: ExpertType;
  name: string;
  description: string;
  capabilities: string[];
  model: string;
  temperature: number;
  max_sub_agents: number;
  tools: string[]; // tool names this expert can use
}

export interface MoETask {
  id: string;
  parent_id?: string;
  type: ExpertType;
  instruction: string;
  context: string[];
  tools_allowed: string[];
  dependencies: string[];     // sub-tasks that must complete first
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  error?: string;
  sub_tasks: MoETask[];       // spawned sub-tasks
  created_at: number;
  completed_at?: number;
  assigned_to?: string;       // expert or sub-agent ID
}

export interface MoERoute {
  primary: ExpertType;
  supporting: ExpertType[];
  confidence: number;
  reasoning: string;
}

export interface SubAgentConfig {
  id: string;
  task: MoETask;
  context: string;
  tools: string[];
  model: string;
  temperature: number;
  max_steps: number;
  parent_id: string;
  memory_bus_id: string;
}

export interface SubAgentResult {
  agent_id: string;
  task_id: string;
  success: boolean;
  output: string;
  steps_taken: number;
  tokens_used: number;
  duration_ms: number;
  error?: string;
  sub_results: SubAgentResult[]; // recursive
}

export interface MemoryBusMessage {
  from_agent: string;
  to_agent?: string;           // undefined = broadcast
  type: "context" | "result" | "request" | "update" | "error";
  content: string;
  timestamp: number;
  task_id?: string;
}
