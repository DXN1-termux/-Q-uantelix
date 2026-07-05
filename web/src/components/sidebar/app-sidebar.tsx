"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { QuantelixIcon } from "@/components/brand/logo";
import { useAgentStore } from "@/lib/agent-store";
import {
  MessageSquare,
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Trash2,
  History,
} from "lucide-react";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { conversations, activeConversationId, createConversation, setActiveConversation } = useAgentStore();

  return (
    <div
      className={cn(
        "flex flex-col bg-[#161b22] border-r border-[#21262d] transition-all duration-200",
        collapsed ? "w-[52px]" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center h-12 px-3 border-b border-[#21262d]", collapsed && "justify-center px-0")}>
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1">
            <QuantelixIcon size={20} />
            <span className="font-semibold text-sm text-[#e6edf3]">uantelix</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#8b949e] hover:text-[#e6edf3]"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </Button>
      </div>

      {/* New Chat Button */}
      {!collapsed && (
        <div className="p-2">
          <Button
            onClick={createConversation}
            className="w-full justify-start gap-2 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d]"
            size="sm"
          >
            <Plus size={16} />
            New Chat
          </Button>
        </div>
      )}

      {collapsed && (
        <div className="p-1 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#8b949e] hover:text-[#e6edf3]"
            onClick={createConversation}
          >
            <Plus size={16} />
          </Button>
        </div>
      )}

      {/* Conversations List */}
      {!collapsed && (
        <>
          <div className="px-3 py-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8b949e] uppercase tracking-wider">
              <History size={12} />
              History
            </div>
          </div>
          <ScrollArea className="flex-1 px-1">
            {conversations.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-[#8b949e]">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                    conv.id === activeConversationId
                      ? "bg-[#1f2937] text-[#e6edf3]"
                      : "text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
                  )}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))
            )}
          </ScrollArea>
        </>
      )}

      {/* Bottom Actions */}
      <div className={cn("border-t border-[#21262d] p-2", collapsed && "flex flex-col items-center gap-1")}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]",
            collapsed ? "h-8 w-8 p-0" : "w-full justify-start gap-2"
          )}
        >
          <Settings size={16} />
          {!collapsed && "Settings"}
        </Button>
      </div>
    </div>
  );
}
