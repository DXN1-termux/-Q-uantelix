"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble, ThinkingIndicator, AgentStateBar } from "./message";
import { InputBar } from "./input-bar";
import { useAgentStore } from "@/lib/agent-store";
import { QuantelixLogo, QuantelixIcon } from "@/components/brand/logo";
import { EmptyStateIllustration, LoadingSpinner } from "@/components/brand/custom-illustrations";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  onSend: (message: string) => void;
  onStop: () => void;
}

const SUGGESTIONS = [
  { title: "Write Code", desc: "Create and edit files with full diffs" },
  { title: "Run Commands", desc: "Execute terminal commands" },
  { title: "Search Web", desc: "Browse and fetch information" },
  { title: "Use Git", desc: "Commit, branch, push changes" },
];

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
      <ScrollArea ref={scrollRef} className="flex-1">
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-16">
            <div className="mb-8 flex flex-col items-center">
              <QuantelixLogo size="lg" className="mb-8" />
              <p className="text-[#8b949e] text-sm text-center max-w-md leading-relaxed">
                An autonomous AI agent with code generation, file editing, terminal access,
                web browsing, and persistent memory.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-[10px] text-[#484f58] tracking-wider uppercase">
                <span className="w-8 h-px bg-[#21262d]" />
                <span>100M context</span>
                <span className="w-8 h-px bg-[#21262d]" />
                <span>MoE agents</span>
                <span className="w-8 h-px bg-[#21262d]" />
                <span>Plugin marketplace</span>
                <span className="w-8 h-px bg-[#21262d]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item.title}
                  onClick={() => onSend(item.desc)}
                  className={cn(
                    "group text-left p-3.5 rounded-lg transition-all",
                    "bg-[#161b22] border border-[#21262d]",
                    "hover:border-[#38bdf8]/30 hover:shadow-sm hover:shadow-[#38bdf8]/5"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] opacity-40 group-hover:opacity-80 transition-opacity" />
                    <span className="text-sm font-medium text-[#e6edf3]">{item.title}</span>
                  </div>
                  <div className="text-xs text-[#8b949e] ml-3.5">{item.desc}</div>
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

      {isRunning && <AgentStateBar state={state} />}
      <InputBar onSend={onSend} onStop={onStop} disabled={false} isRunning={isRunning} />
    </div>
  );
}
