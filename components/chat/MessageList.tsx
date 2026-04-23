"use client";

import { useEffect, useRef } from "react";
import Message from "./Message";
import type { ConversationMessage } from "@/hooks/chat/useConversations";
import type { ToolRun } from "@/utils/chat/tools";

interface MessageListProps {
  messages: ConversationMessage[];
  streamingContent?: string;
  streamingToolRuns?: ToolRun[];
  onRegenerate?: (index: number) => void;
  onArtifactClick?: (id: string) => void;
}

export default function MessageList({
  messages,
  streamingContent,
  streamingToolRuns,
  onRegenerate,
  onArtifactClick,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, streamingToolRuns]);

  return (
    <div className="chat-scrollbar flex-1 space-y-5 overflow-y-auto px-4 py-6 md:px-6">
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

      <div ref={bottomRef} />
    </div>
  );
}
