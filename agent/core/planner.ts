// ============================================================
// [Q]uantelix Agent Engine — Planner
// Decides what to do next via LLM reasoning
// ============================================================

import {
  ConversationMessage,
  ToolDefinition,
  AgentConfig,
  PlanStep,
} from "./types";

export interface PlanResult {
  steps: PlanStep[];
  reasoning: string;
  is_final: boolean;
  response?: string;
}

export class Planner {
  constructor(
    private tools: ToolDefinition[],
    private config: AgentConfig
  ) {}

  async plan(messages: ConversationMessage[]): Promise<PlanResult> {
    const toolDescriptions = this.tools
      .map(
        (t) =>
          `- ${t.name}: ${t.description} (args: ${JSON.stringify(t.input_schema)})`
      )
      .join("\n");

    const systemPrompt = `${this.config.system_prompt}

You have access to the following tools:
${toolDescriptions}

Respond with a JSON plan:
{
  "reasoning": "your reasoning",
  "is_final": false,
  "response": "final answer if done",
  "steps": [
    { "description": "what to do", "tool": "tool_name", "args": {} }
  ]
}

If no tools are needed, set is_final to true and provide your response.`;

    // In production this calls the LLM. For now, return a structured response
    // that the orchestrator will use. The actual LLM call happens via providers.
    return {
      reasoning: "Planning next actions based on conversation context",
      steps: [],
      is_final: true,
      response: "Planning complete.",
    };
  }

  updateTools(tools: ToolDefinition[]): void {
    this.tools = tools;
  }
}
