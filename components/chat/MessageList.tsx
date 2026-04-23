"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Message from "./Message";
import ThinkingIndicator from "./ThinkingIndicator";
import type { ConversationMessage } from "@/hooks/chat/useConversations";
import type { ToolRun } from "@/utils/chat/tools";

interface MessageListProps {
  messages: ConversationMessage[];
  streamingContent?: string;
  streamingToolRuns?: ToolRun[];
  isStreaming?: boolean;
  onRegenerate?: (index: number) => void;
  onArtifactClick?: (id: string) => void;
}

export default function MessageList({
  messages,
  streamingContent,
  streamingToolRuns,
  isStreaming,
  onRegenerate,
  onArtifactClick,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const checkScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsNearBottom(isAtBottom);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, [checkScroll]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Auto-scroll when streaming and near bottom
  useEffect(() => {
    if (isStreaming && isNearBottom) {
      scrollToBottom("auto");
    }
  }, [streamingContent, streamingToolRuns, isStreaming, isNearBottom, scrollToBottom]);

  // Scroll to bottom on new messages from user
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const showThinking =
    isStreaming && !streamingContent && (!streamingToolRuns || streamingToolRuns.length === 0);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={containerRef} className="chat-scrollbar h-full overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-5">
          {messages.map((message, index) => (
            <Message
              key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
              role={message.role}
              content={message.content}
              attachments={message.attachments}
              toolRuns={message.toolRuns}
              onRegenerate={
                message.role === "assistant" && onRegenerate
                  ? () => onRegenerate(index)
                  : undefined
              }
              onArtifactClick={onArtifactClick}
            />
          ))}

          {(streamingContent || (streamingToolRuns && streamingToolRuns.length > 0)) && (
            <Message
              role="assistant"
              content={streamingContent ?? ""}
              toolRuns={streamingToolRuns}
              isStreaming
              onArtifactClick={onArtifactClick}
            />
          )}

          {showThinking && <ThinkingIndicator />}

          <div ref={bottomRef} className="h-px" />
        </div>
      </div>

      {!isNearBottom && (
        <button
          onClick={() => {
            scrollToBottom();
            setIsNearBottom(true);
          }}
          className="absolute bottom-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--chat-border2)] bg-[var(--chat-bg2)] text-[var(--chat-text2)] shadow-lg transition-all hover:bg-[var(--chat-bg3)] hover:text-[var(--chat-text)]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
