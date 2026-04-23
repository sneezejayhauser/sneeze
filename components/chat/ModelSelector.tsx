"use client";

import { useState, useRef, useEffect } from "react";
import { useModels } from "@/hooks/chat/useModels";
import { useChatContext } from "@/context/ChatContext";

interface ModelSelectorProps {
  apiBaseUrl: string;
  apiKey: string;
  value: string;
  onChange: (model: string) => void;
}

export default function ModelSelector({ apiBaseUrl, apiKey, value, onChange }: ModelSelectorProps) {
  const { models, loading, customModel } = useModels(apiBaseUrl, apiKey);
  const { settings } = useChatContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allModels = [
    ...models,
    ...(settings.customModel || customModel
      ? [{ id: settings.customModel || customModel, object: "model" }]
      : []),
  ];

  const selected = allModels.find((model) => model.id === value) ?? allModels[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-1.5 rounded-md border border-[var(--chat-border)] bg-[var(--chat-bg2)] px-2.5 py-1.5 text-xs font-medium text-[var(--chat-text2)] transition-colors hover:bg-[var(--chat-bg3)] hover:text-[var(--chat-text)]"
      >
        {selected?.id ?? "Select model"}
        <svg className="h-3 w-3 text-[var(--chat-text3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg2)] py-1 shadow-xl">
          {loading && <div className="px-3 py-2 text-xs text-[var(--chat-text3)]">Loading models…</div>}

          {allModels.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onChange(model.id);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                value === model.id
                  ? "bg-[var(--chat-accent-dim)] text-[var(--chat-text)]"
                  : "text-[var(--chat-text2)] hover:bg-[var(--chat-bg3)] hover:text-[var(--chat-text)]"
              }`}
            >
              {model.id}
              {value === model.id && (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
