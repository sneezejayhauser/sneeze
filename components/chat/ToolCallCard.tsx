"use client";

import { useMemo, useState, useEffect } from "react";
import type { ToolRun } from "@/utils/chat/tools";

interface ToolCallCardProps {
  toolRun: ToolRun;
}

function truncateText(value: string, max = 60) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

export default function ToolCallCard({ toolRun }: ToolCallCardProps) {
  const [open, setOpen] = useState(toolRun.status === "running");

  useEffect(() => {
    setOpen(toolRun.status === "running");
  }, [toolRun.status]);

  const preview = useMemo(() => truncateText(toolRun.inputPreview), [toolRun.inputPreview]);

  if (toolRun.status === "running") {
    return (
      <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg2)] px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-[12px] text-[var(--chat-text2)]">
          <svg
            className="h-3.5 w-3.5 animate-[chat-spin_1s_linear_infinite]"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="var(--chat-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="50"
              strokeDashoffset="12"
            />
          </svg>
          <span>{toolRun.label}</span>
        </div>
        <p className="mt-1 font-mono text-[11px] text-[var(--chat-text3)]">{preview}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg2)] px-3.5 py-2.5">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-[12px] text-[var(--chat-text2)]">Used: {toolRun.name}</span>
        <svg
          className={`h-3.5 w-3.5 text-[var(--chat-text3)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          <p className="font-mono text-[11px] text-[var(--chat-text3)]">{preview}</p>
          <pre className="whitespace-pre-wrap rounded-md border border-[var(--chat-border)] bg-[var(--chat-bg)] p-2 text-[12px] leading-relaxed text-[var(--chat-text2)]">
            {toolRun.result}
          </pre>
        </div>
      )}
    </div>
  );
}
