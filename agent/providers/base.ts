// ============================================================
// [Q]uantelix Agent — Base LLM Provider Interface
// ============================================================

import { ConversationMessage, AgentConfig } from "../core/types";

export interface LLMProviderInterface {
  name: string;
  models: string[];
  defaultModel: string;
  chat(messages: ConversationMessage[], config: Partial<AgentConfig>): AsyncGenerator<string, void, undefined>;
  validateKey(key: string): Promise<boolean>;
  isFreeTier(): boolean;
}
