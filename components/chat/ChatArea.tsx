"use client";

import { useCallback, useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import { useConversations } from "@/hooks/chat/useConversations";
import { useStreaming } from "@/hooks/chat/useStreaming";
import { buildMessages } from "@/utils/chat/buildMessages";
import { parseArtifacts } from "@/utils/chat/parseArtifacts";
import type { Attachment } from "@/utils/chat/buildMessages";
import TitleBar from "./TitleBar";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import EmptyState from "./EmptyState";
import ArtifactPanel from "./ArtifactPanel";
import type { Artifact } from "@/utils/chat/parseArtifacts";

export default function ChatArea() {
  const { apiBaseUrl, apiKey, currentConversationId, settings, setCurrentConversationId } =
    useChatContext();
  const { conversations, createConversation, updateConversation } = useConversations();
  const { content: streamingContent, done, error, startStream } = useStreaming();
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);

  const conversation = conversations.find((c) => c.id === currentConversationId);

  const handleSend = useCallback(
    async (text: string, attachments: Attachment[]) => {
      let convId = currentConversationId;
      let model = conversation?.model;

      if (!convId) {
        const newConv = createConversation("gpt-4o");
        convId = newConv.id;
        model = newConv.model;
        setCurrentConversationId(convId);
      }

      if (!model) model = "gpt-4o";

      const userMsg = { role: "user" as const, content: text, attachments };

      const existing = conversations.find((c) => c.id === convId);
      const prevMessages = existing ? [...existing.messages] : [];
      const nextMessages = [...prevMessages, userMsg];

      updateConversation(convId, {
        messages: nextMessages,
        title:
          existing?.title === "New chat" && text
            ? text.slice(0, 40) + (text.length > 40 ? "…" : "")
            : existing?.title,
      });

      const systemPrompt = settings.systemPrompt;
      const payloadMessages = systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }, ...nextMessages]
        : nextMessages;

      const built = buildMessages(payloadMessages);

      const assistantContent = await startStream(built, model, apiBaseUrl, apiKey);

      const afterStreamMessages = [
        ...nextMessages,
        { role: "assistant" as const, content: assistantContent },
      ];
      updateConversation(convId, { messages: afterStreamMessages });
    },
    [
      currentConversationId,
      conversation,
      conversations,
      createConversation,
      updateConversation,
      settings.systemPrompt,
      startStream,
      apiBaseUrl,
      apiKey,
      setCurrentConversationId,
    ]
  );

  const handlePromptClick = useCallback(
    (text: string) => {
      handleSend(text, []);
    },
    [handleSend]
  );

  const handleRegenerate = useCallback(
    async (index: number) => {
      if (!conversation) return;
      const messagesUpTo = conversation.messages.slice(0, index);
      updateConversation(conversation.id, { messages: messagesUpTo });

      const systemPrompt = settings.systemPrompt;
      const payloadMessages = systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }, ...messagesUpTo]
        : messagesUpTo;

      const built = buildMessages(payloadMessages);
      const assistantContent = await startStream(
        built,
        conversation.model,
        apiBaseUrl,
        apiKey
      );
      const finalMessages = [
        ...messagesUpTo,
        { role: "assistant" as const, content: assistantContent },
      ];
      updateConversation(conversation.id, { messages: finalMessages });
    },
    [
      conversation,
      settings.systemPrompt,
      startStream,
      apiBaseUrl,
      apiKey,
      updateConversation,
    ]
  );

  const handleArtifactClick = useCallback(
    (id: string) => {
      if (!conversation) return;
      for (const m of conversation.messages) {
        if (m.role !== "assistant") continue;
        const arts = parseArtifacts(m.content);
        const found = arts.find((a) => a.id === id);
        if (found) {
          setActiveArtifact(found);
          break;
        }
      }
    },
    [conversation]
  );

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden relative">
      <TitleBar onMenuClick={() => {}} />
      {conversation ? (
        <MessageList
          messages={conversation.messages}
          streamingContent={!done ? streamingContent : undefined}
          onRegenerate={handleRegenerate}
          onArtifactClick={handleArtifactClick}
        />
      ) : (
        <EmptyState onPromptClick={handlePromptClick} />
      )}
      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-500/10 border-t border-red-500/20">
          {error}
        </div>
      )}
      <InputBar
        onSend={handleSend}
        disabled={!done}
        placeholder={conversation ? "Message…" : "Start a new chat…"}
      />
      {activeArtifact && (
        <ArtifactPanel artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />
      )}
    </div>
  );
}
