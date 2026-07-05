"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { WorkflowNode, WorkflowEdge, WorkflowDefinition } from "./types";

interface WorkflowCanvasProps {
  workflow: WorkflowDefinition;
  onNodeClick?: (node: WorkflowNode) => void;
  onEdgeClick?: (edge: WorkflowEdge) => void;
  runningNodeId?: string | null;
  onAddNode?: (type: string, position: { x: number; y: number }) => void;
  readOnly?: boolean;
}

export function WorkflowCanvas({
  workflow,
  onNodeClick,
  onEdgeClick,
  runningNodeId,
  readOnly = false,
}: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const nodeColors: Record<string, string> = {
    start: "bg-green-500/20 border-green-500 text-green-400",
    end: "bg-red-500/20 border-red-500 text-red-400",
    action: "bg-[#38bdf8]/10 border-[#38bdf8]/40 text-[#38bdf8]",
    agent: "bg-[#a855f7]/10 border-[#a855f7]/40 text-[#a855f7]",
    condition: "bg-yellow-500/10 border-yellow-500/40 text-yellow-400",
    loop: "bg-orange-500/10 border-orange-500/40 text-orange-400",
    human_input: "bg-blue-500/10 border-blue-500/40 text-blue-400",
    parallel: "bg-cyan-500/10 border-cyan-500/40 text-cyan-400",
    merge: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || readOnly) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <div
      ref={canvasRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-[#0d1117] rounded-lg border border-[#21262d]",
        !readOnly && "cursor-grab active:cursor-grabbing"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#30363d" />
          </marker>
          <marker id="arrowhead-running" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
          </marker>
        </defs>

        {workflow.edges.map((edge) => {
          const fromNode = workflow.nodes.find((n) => n.id === edge.from);
          const toNode = workflow.nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const x1 = (fromNode.position?.x || 0) + 100 + pan.x;
          const y1 = (fromNode.position?.y || 0) + 30 + pan.y;
          const x2 = (toNode.position?.x || 0) + pan.x;
          const y2 = (toNode.position?.y || 0) + 30 + pan.y;
          const midX = (x1 + x2) / 2;

          return (
            <g key={edge.id} className="pointer-events-auto cursor-pointer" onClick={() => onEdgeClick?.(edge)}>
              <path
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={runningNodeId === edge.from ? "#38bdf8" : "#30363d"}
                strokeWidth={runningNodeId === edge.from ? 2.5 : 1.5}
                strokeDasharray={runningNodeId === edge.from ? "6 3" : "none"}
                markerEnd={`url(#${runningNodeId === edge.from ? "arrowhead-running" : "arrowhead"})`}
              />
              {edge.label && (
                <text x={midX} y={(y1 + y2) / 2 - 8}
                  fill="#8b949e" fontSize="10" textAnchor="middle"
                  className="select-none"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div
        className="absolute"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >
        {workflow.nodes.map((node) => {
          const isRunning = node.id === runningNodeId;
          return (
            <div
              key={node.id}
              className={cn(
                "absolute flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all min-w-[160px]",
                nodeColors[node.type] || "bg-[#1f2937] border-[#30363d] text-[#e6edf3]",
                isRunning && "ring-2 ring-[#38bdf8] shadow-lg shadow-[#38bdf8]/20 scale-105 z-10",
                !readOnly && "hover:shadow-md"
              )}
              style={{
                left: node.position?.x || 0,
                top: node.position?.y || 0,
              }}
              onClick={() => onNodeClick?.(node)}
            >
              <div className="flex flex-col">
                <span className="text-xs font-medium">{node.label}</span>
                {node.config.tool_name && (
                  <span className="text-[10px] text-[#8b949e]">{node.config.tool_name}</span>
                )}
              </div>
              {isRunning && (
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse ml-auto" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
