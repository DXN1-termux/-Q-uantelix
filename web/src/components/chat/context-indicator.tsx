"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Database, Layers, Brain } from "lucide-react";

interface ContextUsage {
  virtualTokens: number;
  modelMax: number;
  utilization: number;
  tierBreakdown: Record<string, number>;
}

export function ContextIndicator({ usage }: { usage?: ContextUsage }) {
  const [expanded, setExpanded] = useState(false);

  if (!usage) return null;

  const virtualGB = (usage.virtualTokens / 100_000_000 * 400 / 1024 / 1024).toFixed(1);
  const modelMB = (usage.modelMax / 1000).toFixed(0);
  const utilPct = (usage.utilization * 100).toFixed(1);

  const tiers = usage.tierBreakdown || {};
  const totalChunks = Object.values(tiers).reduce((sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0);

  return (
    <div
      className={cn(
        "fixed bottom-16 right-4 z-50 rounded-xl border border-[#21262d] bg-[#0d1117]/95 backdrop-blur-sm transition-all",
        expanded ? "p-4 w-72" : "p-2 pr-3 cursor-pointer"
      )}
      onClick={() => !expanded && setExpanded(true)}
    >
      {!expanded ? (
        <div className="flex items-center gap-2 text-xs text-[#8b949e]">
          <Database size={12} className="text-[#38bdf8]" />
          <span>{utilPct}%</span>
          <span className="text-[#484f58]">•</span>
          <span>{modelMB}K ctx</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-[#a855f7]" />
              <span className="text-xs font-medium text-[#e6edf3]">Context Engine</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-[#484f58] hover:text-[#8b949e] text-xs"
            >
              ×
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-[#8b949e] mb-1">
                <span>Virtual Context</span>
                <span>{virtualGB} MB stored</span>
              </div>
              <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#38bdf8] to-[#a855f7] rounded-full transition-all"
                  style={{ width: `${Math.min(100, usage.utilization * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-[#8b949e]">
              <span>Model Window</span>
              <span>{modelMB}K tokens</span>
            </div>

            <div className="border-t border-[#21262d] pt-2">
              <div className="text-[10px] text-[#8b949e] mb-1">Tiers ({totalChunks} chunks)</div>
              <div className="flex gap-3 text-[10px]">
                <span className="text-[#38bdf8]">Hot: {tiers.hot || 0}</span>
                <span className="text-[#22d3ee]">Warm: {tiers.warm || 0}</span>
                <span className="text-[#a855f7]">Cool: {tiers.cool || 0}</span>
                <span className="text-[#8b949e]">Cold: {tiers.cold || 0}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
