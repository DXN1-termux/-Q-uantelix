// ============================================================
// [Q]uantelix — Agent State Store (Zustand)
// ============================================================

import { create } from "zustand";

export type AgentState = "idle" | "thinking" | "planning" | "executing_tool" | "evaluating" | "responding" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  tool_calls?: Array<{ name: string; args: Record<string, any> }>;
  created_at: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: number;
  updated_at: number;
}

interface AgentStore {
  state: AgentState;
  conversations: Conversation[];
  activeConversationId: string | null;
  streamingContent: string;
  error: string | null;
  theme: "dark" | "light";

  setState: (state: AgentState) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (token: string) => void;
  clearStreamingContent: () => void;
  addMessage: (message: ChatMessage) => void;
  setError: (error: string | null) => void;
  createConversation: () => string;
  setActiveConversation: (id: string) => void;
  setTheme: (theme: "dark" | "light") => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  state: "idle",
  conversations: [],
  activeConversationId: null,
  streamingContent: "",
  error: null,
  theme: "dark",

  setState: (state) => set({ state }),

  setStreamingContent: (content) => set({ streamingContent: content }),

  appendStreamingContent: (token) =>
    set((s) => ({ streamingContent: s.streamingContent + token })),

  clearStreamingContent: () => set({ streamingContent: "" }),

  addMessage: (message) => {
    const { conversations, activeConversationId } = get();
    if (!activeConversationId) return;
    set({
      conversations: conversations.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [...c.messages, message], updated_at: Date.now() }
          : c
      ),
    });
  },

  setError: (error) => set({ error }),

  createConversation: () => {
    const id = crypto.randomUUID();
    const conv: Conversation = {
      id,
      title: `Chat ${new Date().toLocaleTimeString()}`,
      messages: [],
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    set((s) => ({
      conversations: [conv, ...s.conversations],
      activeConversationId: id,
    }));
    return id;
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setTheme: (theme) => set({ theme }),
}));
