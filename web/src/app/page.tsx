"use client";

import { ChatPanel } from "@/components/chat/chat-panel";
import { useAgent } from "@/hooks/use-agent";

export default function Home() {
  const { sendMessage, stopAgent, isRunning, state } = useAgent();

  return (
    <ChatPanel
      onSend={sendMessage}
      onStop={stopAgent}
    />
  );
}
