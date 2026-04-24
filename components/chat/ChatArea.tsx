"use client";

import { useCallback, useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import { useConversations } from "@/hooks/chat/useConversations";
import { useStreaming } from "@/hooks/chat/useStreaming";
import { useSandbox } from "@/hooks/chat/useSandbox";
import { useTools } from "@/hooks/chat/useTools";
import { buildMessages, buildSystemPrompt } from "@/utils/chat/buildMessages";
import { parseArtifacts } from "@/utils/chat/parseArtifacts";
import { getDefaultModelForProvider, normalizeModelForProvider } from "@/utils/chat/modelResolver";
import type { Attachment } from "@/utils/chat/buildMessages";
import TitleBar from "./TitleBar";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import EmptyState from "./EmptyState";
import ArtifactPanel from "./ArtifactPanel";
import type { Artifact } from "@/utils/chat/parseArtifacts";

export default function ChatArea() {
  const {
    apiBaseUrl,
    apiKey,
    currentConversationId,
    settings,
    setCurrentConversationId,
    defaultSystemPrompt,
    availableSkillIds,
  } = useChatContext();
  const { conversations, createConversation, updateConversation } = useConversations();
  const {
    content: streamingContent,
    done,
    error,
    toolRuns,
    toolsUnavailableNote,
    startStream,
  } = useStreaming();
  const { enabledTools } = useTools();
  const { status: sandboxStatus, sandboxId, createSandbox } = useSandbox();
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);

  const conversation = conversations.find((c) => c.id === currentConversationId);

  const runSandboxTool = useCallback(
    async (
      type: "bash" | "python" | "write_file" | "read_file" | "list_dir",
      options: { code?: string; path?: string; content?: string }
    ): Promise<{ result: string; error?: string }> => {
      const ready = await createSandbox();
      if (!ready) {
        return { result: "", error: "Sandbox unavailable" };
      }

      const response = await fetch("/chat/api/sandbox/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...options }),
      });

      const data = (await response.json()) as { text?: string; error?: string };
      return {
        result: data.text || "",
        error: data.error,
      };
    },
    [createSandbox]
  );

  const handleSend = useCallback(
    async (text: string, attachments: Attachment[]) => {
      let convId = currentConversationId;
      let model = conversation?.model;
      const fallbackModel = getDefaultModelForProvider(apiBaseUrl);

      if (!convId) {
        const newConv = await createConversation(fallbackModel);
        if (!newConv) return;
        convId = newConv.id;
        model = newConv.model;
        setCurrentConversationId(convId);
      }

      if (!model) model = fallbackModel;
      model = normalizeModelForProvider(model, apiBaseUrl);

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

      const systemPrompt = buildSystemPrompt(
        defaultSystemPrompt,
        settings.systemPrompt,
        availableSkillIds
      );
      const payloadMessages = systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }, ...nextMessages]
        : nextMessages;

      const built = buildMessages(payloadMessages);

      const streamResult = await startStream(
        built,
        model,
        apiBaseUrl,
        apiKey,
        enabledTools,
        runSandboxTool
      );

      const afterStreamMessages = [
        ...nextMessages,
        {
          role: "assistant" as const,
          content: streamResult.content,
          ...(streamResult.toolRuns.length > 0 ? { toolRuns: streamResult.toolRuns } : {}),
        },
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
      defaultSystemPrompt,
      availableSkillIds,
      startStream,
      runSandboxTool,
      apiBaseUrl,
      apiKey,
      setCurrentConversationId,
      enabledTools,
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

      const systemPrompt = buildSystemPrompt(
        defaultSystemPrompt,
        settings.systemPrompt,
        availableSkillIds
      );
      const payloadMessages = systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }, ...messagesUpTo]
        : messagesUpTo;

      const built = buildMessages(payloadMessages);
      const streamResult = await startStream(
        built,
        normalizeModelForProvider(conversation.model, apiBaseUrl),
        apiBaseUrl,
        apiKey,
        enabledTools,
        runSandboxTool
      );
      const finalMessages = [
        ...messagesUpTo,
        {
          role: "assistant" as const,
          content: streamResult.content,
          ...(streamResult.toolRuns.length > 0 ? { toolRuns: streamResult.toolRuns } : {}),
        },
      ];
      updateConversation(conversation.id, { messages: finalMessages });
    },
    [
      conversation,
      settings.systemPrompt,
      defaultSystemPrompt,
      availableSkillIds,
      startStream,
      runSandboxTool,
      apiBaseUrl,
      apiKey,
      updateConversation,
      enabledTools,
    ]
  );

  const handleArtifactClick = useCallback(
    (id: string) => {
      if (!conversation) return;
      for (const message of conversation.messages) {
        if (message.role !== "assistant") continue;
        const artifacts = parseArtifacts(message.content);
        const found = artifacts.find((artifact) => artifact.id === id);
        if (found) {
          setActiveArtifact(found);
          break;
        }
      }
    },
    [conversation]
  );

  return (
    <div className="chat-shell relative flex h-full flex-1 flex-col overflow-hidden bg-[var(--chat-bg)]">
      <TitleBar
        onMenuClick={() => {}}
        conversation={conversation}
        onModelChange={(model) => {
          if (!conversation) return;
          updateConversation(conversation.id, {
            model: normalizeModelForProvider(model, apiBaseUrl),
          });
        }}
        onTitleChange={(title) => {
          if (!conversation) return;
          updateConversation(conversation.id, { title });
        }}
        sandboxStatus={sandboxStatus}
        sandboxId={sandboxId}
      />
      {conversation ? (
        <MessageList
          messages={conversation.messages}
          streamingContent={!done ? streamingContent : undefined}
          streamingToolRuns={!done ? toolRuns : undefined}
          isStreaming={!done}
          onRegenerate={handleRegenerate}
          onArtifactClick={handleArtifactClick}
        />
      ) : (
        <EmptyState onPromptClick={handlePromptClick} />
      )}
      {error && (
        <div className="border-t border-[var(--chat-border)] bg-[var(--chat-accent-dim)] px-4 py-2 text-xs text-[var(--chat-text2)]">
          {error}
        </div>
      )}
      <InputBar
        onSend={handleSend}
        disabled={!done}
        notice={toolsUnavailableNote}
        placeholder={conversation ? "Message Claude…" : "How can I help you today?"}
        floating={!conversation}
      />
      {activeArtifact && (
        <ArtifactPanel artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />
      )}
    </div>
  );
}
