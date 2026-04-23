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
}

export default function ChatApp({
  apiBaseUrl,
  apiKey,
  defaultSystemPrompt,
  availableSkillIds,
}: ChatAppProps) {
  return (
    <ChatProvider
      apiBaseUrl={apiBaseUrl}
      apiKey={apiKey}
      defaultSystemPrompt={defaultSystemPrompt}
      availableSkillIds={availableSkillIds}
    >
      <div className="flex h-full w-full">
        <ChatBody />
      </div>
    </ChatProvider>
  );
}
