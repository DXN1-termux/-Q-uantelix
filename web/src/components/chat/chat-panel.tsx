"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble, ThinkingIndicator } from "./message";
import { InputBar } from "./input-bar";
import { useAgentStore } from "@/lib/agent-store";
import { QuantelixLogo, QuantelixIcon } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { Command, Sparkles, Layers, Globe, GitBranch, Terminal } from "lucide-react";

interface ChatPanelProps {
  onSend: (message: string) => void;
  onStop: () => void;
}

const SUGGESTIONS = [
  { icon: Terminal, title: "Write Code", desc: "Create and edit files" },
  { icon: GitBranch, title: "Run Git", desc: "Commit, branch, push" },
  { icon: Globe, title: "Search Web", desc: "Browse and fetch info" },
  { icon: Layers, title: "Build Workflow", desc: "Visual multi-step automation" },
];

export function ChatPanel({ onSend, onStop }: ChatPanelProps) {
  const { conversations, activeConversationId, streamingContent, state, contextUsage } = useAgentStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConv?.messages || [];
  const isRunning = state !== "idle" && state !== "error";
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, state]);

  const showWelcome = messages.length === 0 && !isRunning;

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Top bar */}
      <div className="flex items-center justify-between h-10 px-4 border-b border-[#21262d] bg-[#0d1117]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#484f58] font-medium tracking-wider uppercase">
            {activeConv ? "Chat" : "Workspace"}
          </span>
          {contextUsage && (
            <>
              <span className="text-[#30363d] text-[10px]">·</span>
              <span className="text-[10px] text-[#484f58]">
                {(contextUsage.virtualTokens / 1000000).toFixed(1)}M / 100M context
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[#161b22] text-[#484f58] border border-[#21262d] flex items-center gap-1">
            <Command size={10} />K
          </kbd>
          <span className="text-[10px] text-[#30363d]">quick action</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1">
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-20">
            <div className="mb-10 flex flex-col items-center">
              <div className="relative mb-8">
                <QuantelixLogo size="lg" />
                <div className="absolute -inset-4 bg-gradient-to-r from-[#38bdf8]/5 via-transparent to-[#a855f7]/5 blur-xl rounded-full" />
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161b22] border border-[#21262d] mb-6">
                <Sparkles size={12} className="text-[#38bdf8]" />
                <span className="text-xs text-[#8b949e]">
                  100M context · MoE agents · Marketplace
                </span>
              </div>

              <p className="text-sm text-[#484f58] text-center max-w-md leading-relaxed">
                Autonomous AI agent with code generation, file editing, terminal access,
                web browsing, and persistent memory.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 max-w-md w-full">
              {SUGGESTIONS.map(({ icon: Icon, title, desc }) => (
                <button
                  key={title}
                  onClick={() => { onSend(desc); setShowSuggestions(false); }}
                  className={cn(
                    "group flex items-start gap-3 p-3.5 rounded-xl transition-all text-left",
                    "bg-[#161b22] border border-[#21262d]",
                    "hover:border-[#38bdf8]/20 hover:bg-[#1c2128] hover:shadow-sm"
                  )}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1f2937] flex items-center justify-center shrink-0 group-hover:bg-[#21262d] transition-colors">
                    <Icon size={13} className="text-[#8b949e] group-hover:text-[#38bdf8] transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#e6edf3]">{title}</div>
                    <div className="text-xs text-[#484f58] mt-0.5">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg, i) => (
              <div key={msg.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <MessageBubble message={msg} />
              </div>
            ))}
            {streamingContent && (
              <div className="px-4 py-1 animate-slide-up">
                <div className="flex gap-3 ml-11 max-w-[85%]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a855f7]/20 shrink-0 mt-1">
                    <QuantelixIcon size={14} className="text-[#a855f7]" />
                  </div>
                  <div className="bg-[#161b22] border border-[#21262d] rounded-xl px-4 py-2.5 text-sm text-[#e6edf3] leading-relaxed">
                    {streamingContent}
                    <span className="inline-block w-0.5 h-4 bg-[#38bdf8] ml-0.5 animate-pulse align-middle" />
                  </div>
                </div>
              </div>
            )}
            {isRunning && !streamingContent && <ThinkingIndicator />}
          </div>
        )}
      </ScrollArea>

      {/* Agent State Bar */}
      {isRunning && (
        <div className="status-bar-enter">
          <div className="flex items-center gap-2 px-4 py-1.5 border-t border-[#21262d] bg-[#161b22]/80">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
            <span className="text-[11px] text-[#484f58] font-medium tracking-wide uppercase">
              {state === "thinking" && "Thinking"}
              {state === "planning" && "Planning"}
              {state === "executing_tool" && "Using tools"}
              {state === "evaluating" && "Evaluating"}
              {state === "responding" && "Responding"}
              {"Error"}
            </span>
            <span className="text-[#30363d] text-[10px]">·</span>
            <span className="text-[10px] text-[#484f58]">{messages.length} messages</span>
          </div>
        </div>
      )}

      {/* Input */}
      <InputBar onSend={onSend} onStop={onStop} disabled={false} isRunning={isRunning} />
    </div>
  );
}
