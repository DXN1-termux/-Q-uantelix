"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { QuantelixIcon } from "@/components/brand/logo";
import { useAgentStore } from "@/lib/agent-store";
import {
  MessageSquare, Plus, Settings, PanelLeftClose, PanelLeft,
  History, Command, Search, Sparkles, Layers, Database,
  Bot, Workflow, Store, Shield, ChevronDown,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: MessageSquare, label: "Chat", id: "chat" },
  { icon: Layers, label: "Workflows", id: "workflows" },
  { icon: Store, label: "Marketplace", id: "marketplace" },
  { icon: Database, label: "Knowledge", id: "knowledge" },
  { icon: Shield, label: "Admin", id: "admin" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("chat");
  const { conversations, activeConversationId, createConversation, setActiveConversation, memoryStats } = useAgentStore();

  return (
    <div
      className={cn(
        "flex flex-col bg-[#0d1117] border-r border-[#21262d] transition-all duration-200 relative",
        collapsed ? "w-[52px]" : "w-[260px]"
      )}
    >
      {/* Brand Header */}
      <div className={cn(
        "flex items-center h-12 px-3 border-b border-[#21262d]",
        collapsed && "justify-center px-0"
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 flex-1">
            <div className="relative">
              <QuantelixIcon size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#e6edf3] tracking-tight">uantelix</span>
              <span className="text-[9px] text-[#484f58] tracking-widest uppercase">Agentic AI</span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <QuantelixIcon size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-[#484f58] hover:text-[#8b949e] hover:bg-transparent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
        </Button>
      </div>

      {/* Navigation */}
      <div className={cn("px-2 pt-3 space-y-0.5", collapsed && "px-1")}>
        {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => setActiveNav(id)}
            className={cn(
              "flex items-center gap-2.5 w-full rounded-lg text-sm transition-all",
              collapsed ? "justify-center h-9 w-9 mx-auto" : "px-2.5 py-2",
              activeNav === id
                ? "text-[#e6edf3] bg-[#1f2937]"
                : "text-[#484f58] hover:text-[#8b949e] hover:bg-[#161b22]"
            )}
          >
            <Icon size={collapsed ? 18 : 16} className={cn(
              activeNav === id && "text-[#38bdf8]"
            )} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </div>

      <Separator className="mx-2 my-3 bg-[#21262d]" />

      {/* New Chat */}
      {!collapsed && (
        <div className="px-2 mb-2">
          <Button
            onClick={createConversation}
            className="w-full justify-start gap-2.5 bg-[#1f2937] hover:bg-[#21262d] text-[#e6edf3] border border-[#30363d] text-sm h-9 rounded-lg transition-all hover:border-[#38bdf8]/30"
            size="sm"
          >
            <Plus size={15} />
            <span>New Chat</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#0d1117] text-[#484f58] border border-[#21262d]">
              <Command size={10} className="inline" />K
            </kbd>
          </Button>
        </div>
      )}

      {collapsed && (
        <div className="flex justify-center mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#484f58] hover:text-[#8b949e]"
            onClick={createConversation}
          >
            <Plus size={16} />
          </Button>
        </div>
      )}

      {/* History */}
      {!collapsed && (
        <>
          <div className="px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#484f58] uppercase tracking-widest">
              <History size={11} />
              History
            </div>
            <span className="text-[10px] text-[#30363d]">{conversations.length}</span>
          </div>
          <ScrollArea className="flex-1 px-1">
            {conversations.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-[#161b22] flex items-center justify-center">
                  <MessageSquare size={14} className="text-[#30363d]" />
                </div>
                <p className="text-xs text-[#484f58]">No conversations</p>
                <p className="text-[10px] text-[#30363d] mt-0.5">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {conversations.slice(0, 50).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all text-left group",
                      conv.id === activeConversationId
                        ? "bg-[#1f2937] text-[#e6edf3]"
                        : "text-[#484f58] hover:text-[#8b949e] hover:bg-[#161b22]"
                    )}
                  >
                    <MessageSquare size={13} className="shrink-0 opacity-50 group-hover:opacity-80" />
                    <span className="truncate text-xs">{conv.title}</span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      )}

      {/* Bottom Actions */}
      <div className={cn(
        "border-t border-[#21262d] p-2 space-y-0.5",
        collapsed && "flex flex-col items-center gap-1"
      )}>
        <button className={cn(
          "flex items-center gap-2.5 w-full rounded-lg text-sm transition-all text-[#484f58] hover:text-[#8b949e] hover:bg-[#161b22]",
          collapsed ? "justify-center h-9 w-9 mx-auto" : "px-2.5 py-2"
        )}>
          <Settings size={16} />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>

      {/* Status Bar (bottom edge) */}
      <div className={cn(
        "h-[22px] bg-[#161b22] border-t border-[#21262d] flex items-center px-2",
        collapsed && "justify-center"
      )}>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
          {!collapsed && (
            <>
              <span className="text-[9px] text-[#484f58]">Online</span>
              <span className="text-[#30363d] text-[9px]">·</span>
              <span className="text-[9px] text-[#484f58]">{memoryStats?.total || 0} memories</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
