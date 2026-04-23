"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useConversations } from "@/hooks/chat/useConversations";
import { useChatContext } from "@/context/ChatContext";

interface SearchModalProps {
  onClose: () => void;
}

export default function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const { conversations } = useConversations();
  const { setCurrentConversationId, setActiveView } = useChatContext();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [query, conversations]);

  const handleSelect = useCallback(
    (id: string) => {
      setCurrentConversationId(id);
      setActiveView("chat");
      onClose();
    },
    [setCurrentConversationId, setActiveView, onClose]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">
            Esc
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto chat-scrollbar py-2">
          {results.length === 0 && query.trim() !== "" && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No results found
            </p>
          )}
          {results.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className="flex w-full flex-col gap-0.5 px-4 py-2 text-left hover:bg-slate-800/60 transition-colors"
            >
              <span className="text-sm font-medium text-slate-200">{conv.title}</span>
              <span className="text-xs text-slate-500 truncate">
                {conv.messages[conv.messages.length - 1]?.content.slice(0, 80) || "No messages"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
