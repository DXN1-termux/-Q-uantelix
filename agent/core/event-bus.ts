// ============================================================
// [Q]uantelix Agent Engine — Event Bus
// Real-time pub/sub for agent state → UI updates
// ============================================================

import { AgentEvent, AgentState } from "./types";

type Listener = (event: AgentEvent) => void;

export class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();
  private state: AgentState = "idle";

  on(type: string, listener: Listener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
    return () => this.listeners.get(type)?.delete(listener);
  }

  emit(type: AgentEvent["type"], payload: any): void {
    const event: AgentEvent = { type, payload, timestamp: Date.now() };
    this.listeners.get(type)?.forEach((l) => l(event));
    this.listeners.get("*")?.forEach((l) => l(event));
  }

  setState(s: AgentState): void {
    this.state = s;
    this.emit("state_change", s);
  }

  getState(): AgentState {
    return this.state;
  }

  clear(): void {
    this.listeners.clear();
    this.state = "idle";
  }
}
