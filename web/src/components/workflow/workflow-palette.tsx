"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play, GitBranch, Repeat, UserCheck, Columns3,
  Merge, Terminal, Bot, Circle, Square,
} from "lucide-react";

const NODE_TYPES = [
  { type: "start", label: "Start", icon: Circle, color: "text-green-400" },
  { type: "end", label: "End", icon: Square, color: "text-red-400" },
  { type: "action", label: "Action", icon: Terminal, color: "text-[#38bdf8]" },
  { type: "agent", label: "Sub-Agent", icon: Bot, color: "text-[#a855f7]" },
  { type: "condition", label: "Condition", icon: GitBranch, color: "text-yellow-400" },
  { type: "loop", label: "Loop", icon: Repeat, color: "text-orange-400" },
  { type: "human_input", label: "Human Input", icon: UserCheck, color: "text-blue-400" },
  { type: "parallel", label: "Parallel", icon: Columns3, color: "text-cyan-400" },
  { type: "merge", label: "Merge", icon: Merge, color: "text-emerald-400" },
];

export function WorkflowPalette({ onDragNode }: { onDragNode?: (type: string) => void }) {
  return (
    <Card className="bg-[#161b22] border-[#21262d] p-3">
      <div className="text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-2">
        Nodes
      </div>
      <div className="space-y-1">
        {NODE_TYPES.map(({ type, label, icon: Icon, color }) => (
          <div
            key={type}
            draggable
            onDragStart={() => onDragNode?.(type)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing
                       hover:bg-[#21262d] text-[#e6edf3] text-sm transition-colors"
          >
            <Icon size={14} className={cn("shrink-0", color)} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
