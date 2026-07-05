// ============================================================
// [Q]uantelix — Context Manager (100M Virtual Window)
// Manages the gap between virtual context and actual model window
// ============================================================

import { ConversationMessage, AgentConfig } from "./types";
import { ContextStore, MemoryRow } from "./context-store";
import { SortEngine, SortResult } from "./sort-engine";
import { TokenCounter } from "./token-counter";
import { MemorySystem } from "./memory-system";

export interface ContextBudget {
  virtualTokens: number;       // Total stored (up to 100M)
  modelMaxTokens: number;      // Actual model window
  usedTokens: number;          // Tokens currently in the assembled prompt
  retrievedTokens: number;     // Tokens from sort engine
  recentTokens: number;        // Tokens from recent messages
  systemTokens: number;        // Tokens for system prompt
  remainingTokens: number;     // Budget left for response
}

export interface AssembledContext {
  messages: ConversationMessage[];
  budget: ContextBudget;
  sortResult: SortResult;
}

export class ContextManager {
  private store: ContextStore;
  private sortEngine: SortEngine;
  private tokenCounter: TokenCounter;
  private memorySystem: MemorySystem;
  private recentMessages: ConversationMessage[] = [];
  private model: string;
  private maxVirtualTokens = 100_000_000; // 100M

  constructor(store: ContextStore, model: string = "gpt-4o-mini") {
    this.store = store;
    this.tokenCounter = new TokenCounter();
    this.model = model;
    this.sortEngine = new SortEngine(store, {
      maxTokens: this.tokenCounter.getMaxContext(model),
    });
    this.memorySystem = new MemorySystem(store);
  }

  setModel(model: string): void {
    this.model = model;
    this.sortEngine.updateConfig({
      maxTokens: this.tokenCounter.getMaxContext(model),
    });
  }

  // ─── Add messages ───

  add(message: ConversationMessage): void {
    this.recentMessages.push(message);

    // Store in persistent store as memory
    const memType = message.role === "user" ? "episodic"
      : message.role === "tool" ? "procedural"
      : "semantic";

    this.memorySystem.remember({
      content: message.content,
      type: memType as any,
      source: message.role as any,
      importance: message.role === "user" ? 0.6 : 0.5,
    });

    // Also store as hot context chunk
    this.store.storeChunk({
      id: `chunk_recent_${message.id}`,
      chunk_text: message.content,
      token_count: this.tokenCounter.count(message.content, this.model),
      tier: "hot",
      created_at: message.created_at,
      compressed: false,
    });

    // Keep recent messages bounded
    const maxRecent = 200;
    if (this.recentMessages.length > maxRecent) {
      this.recentMessages = this.recentMessages.slice(-maxRecent);
    }
  }

  // ─── Assemble context for LLM call ───

  async assemble(userQuery: string): Promise<AssembledContext> {
    const modelMax = this.tokenCounter.getMaxContext(this.model);

    // 1. Run sort engine to get best retrieved context
    const sortResult = await this.sortEngine.sort(userQuery);

    // 2. Calculate budget allocation
    const systemPrompt = this.getSystemPrompt();
    const systemTokens = this.tokenCounter.count(systemPrompt, this.model);

    // Recent messages budget
    const recentBudget = Math.floor(modelMax * 0.25);
    let recentTokensUsed = 0;
    const selectedRecent: ConversationMessage[] = [];

    // Take most recent messages that fit
    for (let i = this.recentMessages.length - 1; i >= 0; i--) {
      const msg = this.recentMessages[i];
      const msgTokens = this.tokenCounter.count(msg.content, this.model);
      if (recentTokensUsed + msgTokens > recentBudget) break;
      selectedRecent.unshift(msg);
      recentTokensUsed += msgTokens;
    }

    // Working memory (tool results)
    const workingBudget = Math.floor(modelMax * 0.20);
    const toolMessages = selectedRecent.filter((m) => m.role === "tool");
    const workingTokens = toolMessages.reduce(
      (sum, m) => sum + this.tokenCounter.count(m.content, this.model), 0
    );

    // Retrieved tokens
    const retrievedTokens = sortResult.totalTokens;

    // System budget
    const systemBudget = Math.floor(modelMax * 0.05);

    // Reserve for response
    const reserveTokens = Math.floor(modelMax * 0.10);

    const usedTokens = systemTokens + recentTokensUsed + retrievedTokens;
    const remainingTokens = modelMax - usedTokens;

    // 3. Assemble final message array
    const messages: ConversationMessage[] = [];

    // System prompt
    messages.push({
      id: "system",
      role: "system",
      content: systemPrompt,
      created_at: Date.now(),
    });

    // Retrieved context as system context
    if (sortResult.selected.length > 0) {
      const contextBlock = sortResult.selected
        .map((item) => `[${item.type}] ${item.content}`)
        .join("\n\n---\n\n");

      messages.push({
        id: "retrieved_context",
        role: "system",
        content: `[Relevant context from ${sortResult.selected.length} sources (${sortResult.totalTokens} tokens)]:\n\n${contextBlock}`,
        created_at: Date.now(),
      });
    }

    // Recent messages
    messages.push(...selectedRecent);

    const budget: ContextBudget = {
      virtualTokens: this.store.getTotalTokens(),
      modelMaxTokens: modelMax,
      usedTokens,
      retrievedTokens,
      recentTokens: recentTokensUsed,
      systemTokens,
      remainingTokens,
    };

    return { messages, budget, sortResult };
  }

  // ─── Getters ───

  getRecentMessages(): ConversationMessage[] {
    return [...this.recentMessages];
  }

  getBudget(): ContextBudget {
    return {
      virtualTokens: this.store.getTotalTokens(),
      modelMaxTokens: this.tokenCounter.getMaxContext(this.model),
      usedTokens: 0,
      retrievedTokens: 0,
      recentTokens: this.recentMessages.reduce(
        (sum, m) => sum + this.tokenCounter.count(m.content, this.model), 0
      ),
      systemTokens: 0,
      remainingTokens: 0,
    };
  }

  getUsage(): { virtualTokens: number; modelMax: number; utilization: number; tierBreakdown: Record<string, number> } {
    const virtualTokens = this.store.getTotalTokens();
    const modelMax = this.tokenCounter.getMaxContext(this.model);
    const tierBreakdown = this.store.getTokensByTier();
    return {
      virtualTokens,
      modelMax,
      utilization: virtualTokens / 100_000_000, // % of 100M
      tierBreakdown,
    };
  }

  getMemorySystem(): MemorySystem {
    return this.memorySystem;
  }

  getSortEngine(): SortEngine {
    return this.sortEngine;
  }

  // ─── Reset ───

  reset(): void {
    this.recentMessages = [];
  }

  private getSystemPrompt(): string {
    return `You are [Q]uantelix — an autonomous AI agent. You can use tools to accomplish tasks. Think step by step. You have access to a vast memory system with up to 100M tokens of context. Relevant past context is provided to you automatically.`;
  }
}
