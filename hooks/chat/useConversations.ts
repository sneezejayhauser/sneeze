"use client";

import { useCallback, useEffect, useState } from "react";
import type { ToolRun } from "@/utils/chat/tools";

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Array<{
    id: string;
    dataUrl: string;
    name: string;
    type: string;
  }>;
  toolRuns?: ToolRun[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "cui_conversations";

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // silent fail
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);

  useEffect(() => {
    const cb = () => setConversations(loadConversations());
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const persist = useCallback((next: Conversation[]) => {
    setConversations(next);
    saveConversations(next);
    notify();
  }, []);

  const createConversation = useCallback(
    (model: string): Conversation => {
      const current = loadConversations();
      const conv: Conversation = {
        id: generateId(),
        title: "New chat",
        messages: [],
        model,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist([conv, ...current]);
      return conv;
    },
    [persist]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      const current = loadConversations();
      persist(current.filter((c) => c.id !== id));
    },
    [persist]
  );

  const updateConversation = useCallback(
    (id: string, patch: Partial<Conversation>) => {
      const current = loadConversations();
      persist(
        current.map((c) =>
          c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
        )
      );
    },
    [persist]
  );

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    conversations,
    createConversation,
    deleteConversation,
    updateConversation,
    clearAll,
  };
}
