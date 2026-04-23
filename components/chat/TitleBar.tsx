"use client";

import { useState, useCallback } from "react";
import { useChatContext } from "@/context/ChatContext";
import { useConversations } from "@/hooks/chat/useConversations";
import ModelSelector from "./ModelSelector";
import SettingsModal from "./SettingsModal";

interface TitleBarProps {
  onMenuClick: () => void;
}

export default function TitleBar({ onMenuClick }: TitleBarProps) {
  const { apiBaseUrl, apiKey, currentConversationId } = useChatContext();
  const { conversations, updateConversation } = useConversations();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const conversation = conversations.find((c) => c.id === currentConversationId);

  const handleModelChange = useCallback(
    (model: string) => {
      if (currentConversationId) {
        updateConversation(currentConversationId, { model });
      }
    },
    [currentConversationId, updateConversation]
  );

  const startEdit = useCallback(() => {
    if (!conversation) return;
    setEditValue(conversation.title);
    setEditing(true);
  }, [conversation]);

  const commitEdit = useCallback(() => {
    if (currentConversationId && editValue.trim()) {
      updateConversation(currentConversationId, { title: editValue.trim() });
    }
    setEditing(false);
  }, [currentConversationId, editValue, updateConversation]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {editing ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white outline-none focus:border-sky-500"
            />
          ) : (
            <button
              onClick={startEdit}
              className="truncate text-sm font-medium text-slate-200 hover:text-white transition-colors"
            >
              {conversation?.title ?? "New chat"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {conversation && (
            <ModelSelector
              apiBaseUrl={apiBaseUrl}
              apiKey={apiKey}
              value={conversation.model}
              onChange={handleModelChange}
            />
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Settings"
            title="Settings"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
