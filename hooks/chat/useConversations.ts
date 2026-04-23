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
  
  // Initialize to empty
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // Loading starts true (not yet loaded), set to false after fetch completes
  const [loading, setLoading] = useState(true);

  // Fetch conversations when user changes
  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscriptions = async () => {
      // Create channel first (without subscribing)
      const conversationsChannel = supabase.channel("conversations_changes");

      // Register ALL handlers FIRST (synchronously) before subscribing
      conversationsChannel.on(
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
            setConversations((prev) =>
              prev.filter((c) => c.id !== payload.old.id)
            );
          }
          notify();
        }
      );

      // THEN subscribe once - all handlers already registered
      channel = conversationsChannel;
      await conversationsChannel.subscribe();

      // Fetch conversations after subscription is set up
      try {
        const res = await fetch("/chat/api/conversations");
        if (!cancelled && res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch {
        // silent fail
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, supabase]);

  useEffect(() => {
    const cb = () => {
      // Trigger re-render for listeners
    };
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const createConversation = useCallback(
    async (model: string): Promise<Conversation | null> => {
      if (!user) return null;
      try {
        const res = await fetch("/chat/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "New chat",
            model,
          }),
        });
        if (res.ok) {
          const conv = await res.json();
          notify();
          return conv;
        }
      } catch {
        // silent fail
      }
      return null;
    },
    [user]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/chat/api/conversations/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          notify();
        }
      } catch {
        // silent fail
      }
    },
    []
  );

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
          setConversations((prev) =>
            prev.map((c) => (c.id === id ? updated : c))
          );
          notify();
        }
      } catch {
        // silent fail
      }
    },
    []
  );

  const clearAll = useCallback(async () => {
    if (!user) return;
    try {
      for (const conv of conversations) {
        await fetch(`/chat/api/conversations/${conv.id}`, { method: "DELETE" });
      }
      setConversations([]);
      notify();
    } catch {
      // silent fail
    }
  }, [conversations, user]);

  return {
    conversations,
    loading,
    createConversation,
    deleteConversation,
    updateConversation,
    clearAll,
  };
}