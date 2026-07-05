"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface RemoteCursor {
  userId: string;
  position: { x: number; y: number };
  color: string;
}

interface LiveCursorsProps {
  sessionId?: string;
  userId?: string;
}

export function LiveCursors({ sessionId, userId }: LiveCursorsProps) {
  const [cursors, setCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const [myPosition, setMyPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!sessionId) return;
    const uid = userId || `user_${Math.random().toString(36).slice(2, 8)}`;

    // In production, connect to WebSocket
    // For now, simulate remote users
    const interval = setInterval(() => {
      setCursors((prev) => {
        const next = new Map(prev);
        // Simulate a random cursor
        const fakeId = "demo_user";
        next.set(fakeId, {
          userId: fakeId,
          position: {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          },
          color: "#a855f7",
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, userId]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMyPosition({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-150 ease-linear"
          style={{ left: cursor.position.x, top: cursor.position.y }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L6 14L8 9L13 11L2 2Z" fill={cursor.color} />
          </svg>
          <span
            className="absolute left-4 top-0 text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{ backgroundColor: cursor.color, color: "#000" }}
          >
            {cursor.userId.replace("user_", "").slice(0, 8)}
          </span>
        </div>
      ))}
    </div>
  );
}
