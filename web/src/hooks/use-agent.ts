// ============================================================
// [Q]uantelix — Agent Hook
// Connects UI to the agent engine
// ============================================================

import { useCallback } from "react";
import { useAgentStore, ChatMessage } from "@/lib/agent-store";

// In a real implementation, this would connect to the agent
// running in a Web Worker or API route. For now, we simulate
// the agent loop on the client side.

export function useAgent() {
  const { setState, appendStreamingContent, clearStreamingContent, addMessage, setError, createConversation, activeConversationId, state } = useAgentStore();

  const sendMessage = useCallback(async (content: string) => {
    // Create conversation if none exists
    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: Date.now(),
    };
    addMessage(userMsg);
    clearStreamingContent();

    setState("thinking");

    // Simulate agent thinking & responding
    // In production, this calls the real orchestrator
    setTimeout(() => {
      setState("responding");
      const response = simulateAgentResponse(content);
      let i = 0;

      const interval = setInterval(() => {
        if (i < response.length) {
          appendStreamingContent(response[i]);
          i++;
        } else {
          clearInterval(interval);
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: response,
            created_at: Date.now(),
          };
          addMessage(assistantMsg);
          clearStreamingContent();
          setState("idle");
        }
      }, 15);
    }, 800);

    // Simulate some tool calls before the response
    setTimeout(() => {
      setState("executing_tool");
      const toolMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "tool",
        content: JSON.stringify({ success: true, data: "Processing..." }),
        name: "read_file",
        created_at: Date.now(),
      };
      addMessage(toolMsg);
    }, 200);
  }, [activeConversationId, addMessage, appendStreamingContent, clearStreamingContent, createConversation, setState]);

  const stopAgent = useCallback(() => {
    setState("idle");
    clearStreamingContent();
  }, [setState, clearStreamingContent]);

  return {
    sendMessage,
    stopAgent,
    isRunning: state !== "idle" && state !== "error",
    state,
  };
}

function simulateAgentResponse(input: string): string {
  const responses: Record<string, string> = {
    code: "I'll help you write code. Here's a sample:\n\n```typescript\nfunction greet(name: string): string {\n  return `Hello, ${name}! Welcome to [Q]uantelix.`;\n}\n```\n\nYou can use this as a starting point. What would you like to build?",
    web: "I can search the web for information. Currently web browsing is available in the full agent mode.",
    git: "I can help with git operations — status, commits, branches, and more.",
    default: `I've analyzed your request and here's what I found:\n\n**Summary**\nBased on the context, I can help you accomplish this task using my available tools:\n- Code generation & editing\n- File system operations\n- Terminal commands\n- Web search & browsing\n- Git operations\n\nWhat specific aspect would you like me to work on?`,
  };

  const lower = input.toLowerCase();
  if (lower.includes("code") || lower.includes("write") || lower.includes("create")) return responses.code;
  if (lower.includes("web") || lower.includes("search") || lower.includes("browse")) return responses.web;
  if (lower.includes("git") || lower.includes("commit") || lower.includes("branch")) return responses.git;
  return responses.default;
}
