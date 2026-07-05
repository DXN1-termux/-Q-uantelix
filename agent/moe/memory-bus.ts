// ============================================================
// [Q]uantelix — MoE Memory Bus
// Shared communication channel between all agents
// ============================================================

import { MemoryBusMessage } from "./types";

export class MemoryBus {
  private messages: MemoryBusMessage[] = [];
  private subscribers: Map<string, Array<(msg: MemoryBusMessage) => void>> = new Map();
  private maxMessages = 10000;

  subscribe(agentId: string, callback: (msg: MemoryBusMessage) => void): () => void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, []);
    }
    this.subscribers.get(agentId)!.push(callback);
    return () => {
      const subs = this.subscribers.get(agentId);
      if (subs) {
        const idx = subs.indexOf(callback);
        if (idx >= 0) subs.splice(idx, 1);
      }
    };
  }

  publish(msg: MemoryBusMessage): void {
    this.messages.push(msg);
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    // Deliver to specific agent or broadcast
    if (msg.to_agent) {
      this.subscribers.get(msg.to_agent)?.forEach((cb) => cb(msg));
    } else {
      this.subscribers.forEach((cbs) => cbs.forEach((cb) => cb(msg)));
    }
  }

  getHistory(agentId?: string, since?: number): MemoryBusMessage[] {
    let filtered = this.messages;
    if (agentId) {
      filtered = filtered.filter((m) => m.from_agent === agentId || m.to_agent === agentId || !m.to_agent);
    }
    if (since) {
      filtered = filtered.filter((m) => m.timestamp >= since);
    }
    return filtered;
  }

  getContextFor(agentId: string, maxMessages: number = 50): string {
    const relevant = this.getHistory(agentId)
      .slice(-maxMessages)
      .map((m) => `[${m.from_agent} → ${m.to_agent || "all"}] (${m.type}): ${m.content.slice(0, 500)}`);
    return relevant.join("\n");
  }

  clear(): void {
    this.messages = [];
    this.subscribers.clear();
  }
}
