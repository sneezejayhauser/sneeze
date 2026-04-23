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
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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

  const selected = allModels.find((m) => m.id === value) ?? allModels[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-800/40 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
      >
        {selected?.id ?? "Select model"}
        <svg className="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 rounded-lg border border-slate-700/60 bg-slate-900 shadow-xl z-50 py-1">
          {loading && (
            <div className="px-3 py-2 text-xs text-slate-500">Loading models…</div>
          )}
          {allModels.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                value === m.id
                  ? "bg-sky-500/20 text-sky-400"
                  : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              {m.id}
              {value === m.id && (
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
