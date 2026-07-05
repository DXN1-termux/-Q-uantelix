"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, StopCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="border-t border-[#21262d] bg-[#0d1117]">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            {!input && !isRunning && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <Sparkles size={14} className="text-[#30363d]" />
                <span className="text-sm text-[#30363d]">Ask [Q]uantelix to do anything...</span>
              </div>
            )}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder=""
              className={cn(
                "min-h-[52px] max-h-[200px] bg-[#161b22] border-[#21262d] text-[#e6edf3]",
                "placeholder:text-[#30363d] resize-none rounded-xl py-3.5 px-4 pr-14",
                "focus:border-[#38bdf8]/30 focus:ring-1 focus:ring-[#38bdf8]/10",
                "transition-all duration-200"
              )}
              rows={1}
              disabled={disabled}
            />
            <div className="absolute right-1.5 bottom-1.5">
              {isRunning ? (
                <Button
                  onClick={onStop}
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                >
                  <StopCircle size={16} />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  size="icon"
                  disabled={!input.trim() || disabled}
                  className={cn(
                    "h-9 w-9 rounded-lg transition-all",
                    input.trim()
                      ? "bg-[#38bdf8] hover:bg-[#38bdf8]/80 text-black shadow-sm shadow-[#38bdf8]/20"
                      : "bg-[#21262d] text-[#30363d]"
                  )}
                >
                  <ArrowUp size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-2">
          <span className="text-[10px] text-[#30363d]">
            Press <kbd className="px-1 py-0.5 rounded bg-[#161b22] border border-[#21262d] text-[10px] text-[#484f58]">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-[#161b22] border border-[#21262d] text-[10px] text-[#484f58]">Shift+Enter</kbd> for new line
          </span>
        </div>
      </div>
    </div>
  );
}
