"use client";

import { useCallback, useEffect, useState } from "react";
import type { ToolRun } from "@/utils/chat/tools";
import { useChatContext } from "@/context/ChatContext";

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
  created_at: string;
  updated_at: string;
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function normalizeConversation(raw: Partial<Conversation> | null | undefined): Conversation | null {
  if (!raw?.id) return null;

  return {
    id: raw.id,
    title: typeof raw.title === "string" ? raw.title : "New chat",
    messages: Array.isArray(raw.messages) ? raw.messages : [],
    model: typeof raw.model === "string" ? raw.model : "",
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : "",
  };
}

function normalizeConversationList(raw: unknown): Conversation[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => normalizeConversation(item as Partial<Conversation>))
    .filter((item): item is Conversation => Boolean(item));
}

export function useConversations() {
  const { user, supabase } = useChatContext();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !supabase) return;

    let cancelled = false;
    const topic = `conversations:${user.id}:${Math.random().toString(36).slice(2)}`;

    const loadConversations = () => {
      setLoading(true);
      fetch("/chat/api/conversations")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) setConversations(normalizeConversationList(data));
        })
        .catch(() => {
          if (!cancelled) setConversations([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    // Create channel and attach ALL handlers BEFORE subscribe.
    // Topic must be unique per mount; reusing an already-subscribed topic throws.
    const channel = supabase.channel(topic);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        if (cancelled) return;
        if (payload.eventType === "INSERT") {
          const inserted = normalizeConversation(payload.new as Partial<Conversation>);
          if (!inserted) return;
          setConversations((prev) => [inserted, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          const updated = normalizeConversation(payload.new as Partial<Conversation>);
          if (!updated) return;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === updated.id ? { ...c, ...updated, messages: c.messages } : c
            )
          );
        } else if (payload.eventType === "DELETE") {
          setConversations((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
        notify();
      }
    );

    // Subscribe AFTER all handlers are registered
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED" && !cancelled) {
        loadConversations();
      }
    });

    // Keep UI functional even if realtime socket never reaches SUBSCRIBED.
    loadConversations();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  useEffect(() => {
    const cb = () => {
      setConversations((prev) => [...prev]);
    };
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const createConversation = useCallback(
    async (model: string): Promise<Conversation | null> => {
      if (!user) return null;
      try {
        const res = await fetch("/chat/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New chat", model }),
        });
        if (res.ok) {
          const conv = normalizeConversation((await res.json()) as Partial<Conversation>);
          if (!conv) return null;
          notify();
          return conv;
        }
      } catch {}
      return null;
    },
    [user]
  );

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/chat/api/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        notify();
      }
    } catch {}
  }, []);

  const updateConversation = useCallback(
    async (id: string, patch: Partial<Conversation>) => {
      try {
        const res = await fetch(`/chat/api/conversations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const updated = normalizeConversation((await res.json()) as Partial<Conversation>);
          if (!updated) return;
          setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
          notify();
        }
      } catch {}
    },
    []
  );

  const clearAll = useCallback(async () => {
    if (!user) return;
    for (const conv of conversations) {
      await fetch(`/chat/api/conversations/${conv.id}`, { method: "DELETE" }).catch(() => {});
    }
    setConversations([]);
    notify();
  }, [conversations, user]);

  return { conversations, loading, createConversation, deleteConversation, updateConversation, clearAll };
}
