"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChatSettings {
  systemPrompt: string;
  customModel: string;
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
  };
}

export interface ChatContextValue {
  apiBaseUrl: string;
  apiKey: string;
  activeView: "chat" | "agent";
  currentConversationId: string | null;
  settings: ChatSettings;
  defaultSystemPrompt: string;
  availableSkillIds: string[];
  user: User | null;
  supabase: SupabaseClient;
  setActiveView: (view: "chat" | "agent") => void;
  setCurrentConversationId: (id: string | null) => void;
  setSettings: (settings: ChatSettings) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const SETTINGS_KEY = "cui_settings";

function loadSettings(): ChatSettings {
  if (typeof window === "undefined") {
    return { systemPrompt: "", customModel: "" };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { systemPrompt: "", customModel: "" };
    const parsed = JSON.parse(raw) as ChatSettings;
    return {
      systemPrompt: parsed.systemPrompt || "",
      customModel: parsed.customModel || "",
    };
  } catch {
    return { systemPrompt: "", customModel: "" };
  }
}

function saveSettings(settings: ChatSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // silent fail
  }
}

interface ChatProviderProps {
  children: ReactNode;
  apiBaseUrl: string;
  apiKey: string;
  defaultSystemPrompt: string;
  availableSkillIds: string[];
  user: User | null;
}

export function ChatProvider({ 
  children, 
  apiBaseUrl, 
  apiKey,
  defaultSystemPrompt,
  availableSkillIds,
  user,
}: ChatProviderProps) {
  const [activeView, setActiveViewState] = useState<"chat" | "agent">("chat");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<ChatSettings>(loadSettings);

  const supabase = createSupabaseClient();

  const setActiveView = useCallback((view: "chat" | "agent") => {
    setActiveViewState(view);
  }, []);

  const setSettings = useCallback((next: ChatSettings) => {
    setSettingsState(next);
    saveSettings(next);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        apiBaseUrl,
        apiKey,
        activeView,
        currentConversationId,
        settings,
        defaultSystemPrompt,
        availableSkillIds,
        user,
        supabase,
        setActiveView,
        setCurrentConversationId,
        setSettings,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}