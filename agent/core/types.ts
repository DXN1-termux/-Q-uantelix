// ============================================================
// [Q]uantelix Agent Engine — Core Types
// ============================================================

export type AgentState = "idle" | "thinking" | "planning" | "executing_tool" | "evaluating" | "responding" | "error";

export interface AgentEvent {
  type: "state_change" | "stream_token" | "tool_call" | "tool_result" | "plan_step" | "error" | "done";
  payload: any;
  timestamp: number;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  created_at: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  tool_call_id: string;
  output: string;
  error?: string;
  duration_ms: number;
}

export interface PlanStep {
  id: string;
  description: string;
  tool?: string;
  args?: Record<string, any>;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: string;
}

export interface AgentConfig {
  max_steps: number;
  max_tokens: number;
  temperature: number;
  model: string;
  provider: string;
  system_prompt: string;
  sandbox_enabled: boolean;
  free_tier: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  tags: string[];
  input_schema: Record<string, any>;
  output_schema?: Record<string, any>;
  permissions: {
    filesystem?: string[];
    network?: boolean;
    env?: string[];
  };
  execute: (args: Record<string, any>, context: ToolContext) => Promise<ToolOutput>;
}

export interface ToolContext {
  workspace_dir: string;
  env: Record<string, string>;
  permissions: string[];
  abort_signal: AbortSignal;
}

export interface ToolOutput {
  success: boolean;
  data: any;
  error?: string;
  mime_type?: string;
}

export interface LLMProvider {
  name: string;
  models: string[];
  chat: (messages: ConversationMessage[], config: Partial<AgentConfig>) => AsyncIterable<string>;
  validate_key: (key: string) => Promise<boolean>;
}
