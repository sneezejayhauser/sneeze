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

export default function ChatApp({
  apiBaseUrl,
  apiKey,
}: {
  apiBaseUrl: string;
  apiKey: string;
}) {
  return (
    <ChatProvider apiBaseUrl={apiBaseUrl} apiKey={apiKey}>
      <div className="flex h-full w-full">
        <ChatBody />
      </div>
    </ChatProvider>
  );
}
