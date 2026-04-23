"use client";

import { ChatProvider } from "@/context/ChatContext";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import AgentView from "./AgentView";
import { useChatContext } from "@/context/ChatContext";

function ChatBody() {
  const { activeView } = useChatContext();
  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />
      {activeView === "chat" ? <ChatArea /> : <AgentView />}
    </div>
  );
}

interface ChatAppProps {
  apiBaseUrl: string;
  apiKey: string;
  defaultSystemPrompt: string;
  availableSkillIds: string[];
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
      name?: string;
    };
  } | null;
}

export default function ChatApp({
  apiBaseUrl,
  apiKey,
  defaultSystemPrompt,
  availableSkillIds,
  user,
}: ChatAppProps) {
  return (
    <ChatProvider
      apiBaseUrl={apiBaseUrl}
      apiKey={apiKey}
      defaultSystemPrompt={defaultSystemPrompt}
      availableSkillIds={availableSkillIds}
      user={user}
    >
      <div className="flex h-full w-full">
        <ChatBody />
      </div>
    </ChatProvider>
  );
}