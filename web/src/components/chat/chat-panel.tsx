"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble, ThinkingIndicator, AgentStateBar } from "./message";
import { InputBar } from "./input-bar";
import { useAgentStore } from "@/lib/agent-store";
import { QuantelixLogo } from "@/components/brand/logo";

interface ChatPanelProps {
  onSend: (message: string) => void;
  onStop: () => void;
}

export function ChatPanel({ onSend, onStop }: ChatPanelProps) {
  const { conversations, activeConversationId, streamingContent, state } = useAgentStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConv?.messages || [];
  const isRunning = state !== "idle" && state !== "error";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, state]);

  const showWelcome = messages.length === 0 && !isRunning;

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1">
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-16">
            <QuantelixLogo size="lg" className="mb-6" />
            <p className="text-[#8b949e] text-sm text-center max-w-md">
              An autonomous AI agent with code generation, file editing, terminal access,
              web browsing, and persistent memory.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                { title: "Write Code", desc: "Create and edit files with full diffs" },
                { title: "Run Commands", desc: "Execute terminal commands" },
                { title: "Search Web", desc: "Browse and fetch information" },
                { title: "Use Git", desc: "Commit, branch, push changes" },
              ].map((item) => (
                <button
                  key={item.title}
                  onClick={() => onSend(item.desc)}
                  className="text-left p-3 rounded-lg bg-[#161b22] border border-[#21262d] hover:border-[#30363d] transition-colors"
                >
                  <div className="text-sm font-medium text-[#e6edf3]">{item.title}</div>
                  <div className="text-xs text-[#8b949e] mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {streamingContent && (
              <div className="px-4 py-2">
                <div className="bg-[#161b22] border border-[#21262d] rounded-lg px-4 py-2.5 text-sm text-[#e6edf3] ml-11 max-w-[85%]">
                  {streamingContent}
                  <span className="animate-pulse">▊</span>
                </div>
              </div>
            )}
            {isRunning && !streamingContent && <ThinkingIndicator />}
          </div>
        )}
      </ScrollArea>

      {/* Agent State Bar */}
      {isRunning && <AgentStateBar state={state} />}

      {/* Input */}
      <InputBar onSend={onSend} onStop={onStop} disabled={false} isRunning={isRunning} />
    </div>
  );
}
