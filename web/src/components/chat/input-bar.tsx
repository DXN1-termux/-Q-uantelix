"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentStore } from "@/lib/agent-store";

interface InputBarProps {
  onSend: (message: string) => void;
  onStop: () => void;
  disabled?: boolean;
  isRunning?: boolean;
}

export function InputBar({ onSend, onStop, disabled, isRunning }: InputBarProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || isRunning) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="border-t border-[#21262d] bg-[#0d1117] px-4 py-3">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask [Q]uantelix to do anything..."
            className="min-h-[44px] max-h-[200px] bg-[#161b22] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] resize-none rounded-xl pr-10 py-3 focus:border-[#38bdf8]/50"
            rows={1}
            disabled={disabled}
          />
          {isRunning ? (
            <Button
              onClick={onStop}
              size="icon"
              variant="ghost"
              className="absolute right-1.5 bottom-1.5 h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <StopCircle size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!input.trim() || disabled}
              className={cn(
                "absolute right-1.5 bottom-1.5 h-8 w-8",
                input.trim()
                  ? "bg-[#38bdf8] hover:bg-[#38bdf8]/80 text-black"
                  : "bg-[#21262d] text-[#484f58]"
              )}
            >
              <ArrowUp size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
