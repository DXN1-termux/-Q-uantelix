"use client";

import { ChatMessage } from "@/lib/agent-store";
import { cn } from "@/lib/utils";
import { Bot, User, Code, Terminal, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function ToolIcon({ name }: { name?: string }) {
  if (!name) return <Code size={12} />;
  if (name.includes("code") || name.includes("file")) return <Code size={12} />;
  if (name.includes("terminal") || name.includes("command")) return <Terminal size={12} />;
  if (name.includes("web") || name.includes("search")) return <Globe size={12} />;
  return <Code size={12} />;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  if (isTool) {
    let toolData: any = {};
    try { toolData = JSON.parse(message.content); } catch {}
    return (
      <div className="flex justify-start px-4 py-1 agent-state-enter">
        <Card className="max-w-[80%] bg-[#1f2937]/50 border-[#30363d] px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-[#30363d] text-[#8b949e]">
              <ToolIcon name={message.name} />
              <span className="ml-1">{message.name || "tool"}</span>
            </Badge>
            {toolData.success ? (
              <span className="text-[10px] text-green-500">✓ done</span>
            ) : (
              <span className="text-[10px] text-red-500">✗ failed</span>
            )}
          </div>
          <pre className="text-xs text-[#8b949e] whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
            {typeof toolData.data === "string" ? toolData.data : JSON.stringify(toolData.data, null, 2)}
          </pre>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex px-4 py-2 agent-state-enter", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex gap-3 max-w-[85%]", isUser && "flex-row-reverse")}>
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-1",
          isUser ? "bg-[#38bdf8]/20" : "bg-[#a855f7]/20"
        )}>
          {isUser ? <User size={14} className="text-[#38bdf8]" /> : <Bot size={14} className="text-[#a855f7]" />}
        </div>
        <div>
          <div className={cn(
            "rounded-lg px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-[#38bdf8]/10 text-[#e6edf3] border border-[#38bdf8]/20"
              : "bg-[#161b22] text-[#e6edf3] border border-[#21262d]"
          )}>
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 agent-state-enter">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a855f7]/20 shrink-0">
        <Bot size={14} className="text-[#a855f7]" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="thinking-dot w-2 h-2 rounded-full bg-[#a855f7]" />
        <span className="thinking-dot w-2 h-2 rounded-full bg-[#a855f7]" />
        <span className="thinking-dot w-2 h-2 rounded-full bg-[#a855f7]" />
      </div>
    </div>
  );
}

export function AgentStateBar({ state }: { state: string }) {
  const labels: Record<string, string> = {
    thinking: "Thinking...",
    planning: "Planning...",
    executing_tool: "Using tools...",
    evaluating: "Evaluating results...",
    responding: "Responding...",
    error: "Error occurred",
  };

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-t border-[#21262d] bg-[#161b22]/50">
      <div className={cn(
        "w-2 h-2 rounded-full",
        state === "error" ? "bg-red-500" : "bg-[#38bdf8] animate-pulse"
      )} />
      <span className="text-xs text-[#8b949e]">{labels[state] || state}</span>
    </div>
  );
}
