"use client";

import { useState, useCallback } from "react";
import { useChatContext } from "@/context/ChatContext";
import { useConversations } from "@/hooks/chat/useConversations";
import { formatTime } from "@/utils/chat/formatTime";

interface ConversationListProps {
  onSelect?: () => void;
}

export default function ConversationList({ onSelect }: ConversationListProps) {
  const { currentConversationId, setCurrentConversationId } = useChatContext();
  const { conversations, deleteConversation } = useConversations();
  const [hoverId, setHoverId] = useState<string | null>(null);

  const handleSelect = useCallback(
    (id: string) => {
      setCurrentConversationId(id);
      onSelect?.();
    },
    [setCurrentConversationId, onSelect]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      deleteConversation(id);
    },
    [deleteConversation]
  );

  return (
    <div className="space-y-0.5">
      {conversations.map((conv) => {
        const isActive = conv.id === currentConversationId;
        return (
          <button
            key={conv.id}
            onClick={() => handleSelect(conv.id)}
            onMouseEnter={() => setHoverId(conv.id)}
            onMouseLeave={() => setHoverId(null)}
            className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              isActive
                ? "bg-slate-700/60 text-white"
                : "text-slate-300 hover:bg-slate-700/40 hover:text-white"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{conv.title}</p>
              <p className="text-xs text-slate-500">{formatTime(conv.updatedAt)}</p>
            </div>
            {(hoverId === conv.id || isActive) && (
              <span
                onClick={(e) => handleDelete(e, conv.id)}
                className="ml-2 shrink-0 rounded p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                role="button"
                aria-label="Delete conversation"
                title="Delete"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
