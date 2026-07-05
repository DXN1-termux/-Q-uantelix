"use client";

import { ChatPanel } from "@/components/chat/chat-panel";
import { ContextIndicator } from "@/components/chat/context-indicator";
import { useAgent } from "@/hooks/use-agent";
import { useAgentStore } from "@/lib/agent-store";

export default function Home() {
  const { sendMessage, stopAgent, isRunning, state } = useAgent();
  const contextUsage = useAgentStore((s) => s.contextUsage);

  return (
    <div className="relative h-full">
      <ChatPanel
        onSend={sendMessage}
        onStop={stopAgent}
      />
      <ContextIndicator usage={contextUsage || undefined} />
    </div>
  );
}
