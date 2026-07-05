// ============================================================
// [Q]uantelix Agent Engine — Context Manager
// Manages LLM context window, token budgets, summarization
// ============================================================

import { ConversationMessage, AgentConfig } from "./types";

interface ContextWindow {
  messages: ConversationMessage[];
  totalTokens: number;
  maxTokens: number;
}

export class ContextManager {
  private window: ContextWindow;
  private summary: string = "";

  constructor(maxTokens: number = 128000) {
    this.window = { messages: [], totalTokens: 0, maxTokens };
  }

  add(message: ConversationMessage): void {
    this.window.messages.push(message);
    this.window.totalTokens += this.estimateTokens(message.content);
    if (message.tool_calls) {
      message.tool_calls.forEach((tc) => {
        this.window.totalTokens += this.estimateTokens(JSON.stringify(tc));
      });
    }
    this.compressIfNeeded();
  }

  getMessages(): ConversationMessage[] {
    const msgs = [...this.window.messages];
    if (this.summary) {
      msgs.unshift({
        id: "summary",
        role: "system",
        content: `[Previous context summary: ${this.summary}]`,
        created_at: Date.now(),
      });
    }
    return msgs;
  }

  private compressIfNeeded(): void {
    if (this.window.totalTokens <= this.window.maxTokens * 0.8) return;

    // Remove oldest non-system messages and create summary
    const keep: ConversationMessage[] = [];
    let removed: ConversationMessage[] = [];

    // Keep last 40% of messages, remove oldest 60%
    const cutoff = Math.floor(this.window.messages.length * 0.4);
    for (let i = 0; i < this.window.messages.length; i++) {
      if (i < cutoff) {
        removed.push(this.window.messages[i]);
      } else {
        keep.push(this.window.messages[i]);
      }
    }

    if (removed.length > 0) {
      this.summary = `Summarized ${removed.length} messages: ${removed
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => m.content.slice(0, 100))
        .join(" | ")}`;
    }

    this.window.messages = keep;
    this.window.totalTokens = keep.reduce(
      (sum, m) => sum + this.estimateTokens(m.content),
      0
    );
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  reset(): void {
    this.window = { messages: [], totalTokens: 0, maxTokens: this.window.maxTokens };
    this.summary = "";
  }

  getUsage(): { totalTokens: number; maxTokens: number; messageCount: number } {
    return {
      totalTokens: this.window.totalTokens,
      maxTokens: this.window.maxTokens,
      messageCount: this.window.messages.length,
    };
  }
}
