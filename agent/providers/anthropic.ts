// ============================================================
// [Q]uantelix Agent — Anthropic Provider
// ============================================================

import { LLMProviderInterface } from "./base";
import { ConversationMessage, AgentConfig } from "../core/types";

export class AnthropicProvider implements LLMProviderInterface {
  name = "anthropic";
  models = ["claude-sonnet-4", "claude-haiku-3-5"];
  defaultModel = "claude-haiku-3-5";
  private apiKey: string;
  private baseUrl = "https://api.anthropic.com/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || "";
  }

  setKey(key: string): void {
    this.apiKey = key;
  }

  async *chat(messages: ConversationMessage[], config: Partial<AgentConfig>): AsyncGenerator<string> {
    const model = config.model || this.defaultModel;
    const systemMsg = messages.find((m) => m.role === "system");
    const otherMsgs = messages.filter((m) => m.role !== "system");

    const body = {
      model,
      system: systemMsg?.content || "",
      messages: otherMsgs.map((m) => ({
        role: m.role === "tool" ? "user" : m.role,
        content: m.content,
      })),
      max_tokens: config.max_tokens ?? 4096,
      stream: true,
    };

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
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
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            yield parsed.delta.text;
          }
        } catch {
          // Skip
        }
      }
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model: "claude-haiku-3-5", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  isFreeTier(): boolean {
    return this.defaultModel === "claude-haiku-3-5";
  }
}
