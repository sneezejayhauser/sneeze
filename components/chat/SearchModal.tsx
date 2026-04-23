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
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const normalized = query.toLowerCase();
    return conversations.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(normalized) ||
        conversation.messages.some((message) => message.content.toLowerCase().includes(normalized))
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
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--chat-border2)] bg-[var(--chat-bg2)] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--chat-border)] px-4 py-3">
          <svg className="h-5 w-5 text-[var(--chat-text3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations…"
            className="flex-1 bg-transparent text-sm text-[var(--chat-text)] outline-none placeholder:text-[var(--chat-text3)]"
          />
          <button onClick={onClose} className="text-xs text-[var(--chat-text3)] hover:text-[var(--chat-text2)]">
            Esc
          </button>
        </div>

        <div className="chat-scrollbar max-h-80 overflow-y-auto py-2">
          {results.length === 0 && query.trim() !== "" && (
            <p className="px-4 py-6 text-center text-sm text-[var(--chat-text3)]">No results found</p>
          )}

          {results.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => handleSelect(conversation.id)}
              className="flex w-full flex-col gap-0.5 px-4 py-2 text-left transition-colors hover:bg-[var(--chat-bg3)]"
            >
              <span className="text-sm font-medium text-[var(--chat-text)]">{conversation.title}</span>
              <span className="truncate text-xs text-[var(--chat-text3)]">
                {conversation.messages[conversation.messages.length - 1]?.content.slice(0, 80) ||
                  "No messages"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
