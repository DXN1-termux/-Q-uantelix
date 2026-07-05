// ============================================================
// [Q]uantelix Agent — OpenAI Provider
// ============================================================

import { LLMProviderInterface } from "./base";
import { ConversationMessage, AgentConfig } from "../core/types";

export class OpenAIProvider implements LLMProviderInterface {
  name = "openai";
  models = ["gpt-4o", "gpt-4o-mini", "o3-mini"];
  defaultModel = "gpt-4o-mini";
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || "";
  }

  setKey(key: string): void {
    this.apiKey = key;
  }

  async *chat(messages: ConversationMessage[], config: Partial<AgentConfig>): AsyncGenerator<string> {
    const model = config.model || this.defaultModel;
    const body = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        tool_call_id: m.tool_call_id,
        name: m.name,
      })),
      temperature: config.temperature ?? 0.7,
      max_tokens: config.max_tokens ?? 4096,
      stream: true,
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) yield content;
        } catch {
          // Skip malformed lines
        }
      }
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  isFreeTier(): boolean {
    return this.defaultModel === "gpt-4o-mini";
  }
}
