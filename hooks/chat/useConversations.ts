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

export function useConversations() {
  const { user, supabase } = useChatContext();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !supabase) return;

    let cancelled = false;

    // Step 1: Create channel and attach ALL handlers synchronously BEFORE subscribe
    const channel = supabase.channel(`conversations:${user.id}`);

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
          setConversations((prev) => [payload.new as Conversation, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === payload.new.id ? (payload.new as Conversation) : c
            )
          );
        } else if (payload.eventType === "DELETE") {
          setConversations((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
        notify();
      }
    );

    // Step 2: Subscribe AFTER all handlers are registered
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED" && !cancelled) {
        setLoading(true);
        fetch("/chat/api/conversations")
          .then((res) => res.ok ? res.json() : [])
          .then((data) => {
            if (!cancelled) setConversations(data);
          })
          .catch(() => {
            if (!cancelled) setConversations([]);
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      }
    });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  useEffect(() => {
    const cb = () => {};
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
          const conv = await res.json();
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
          const updated = await res.json();
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