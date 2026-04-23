"use client";

import { useEffect, useRef } from "react";
import Message from "./Message";
import type { ConversationMessage } from "@/hooks/chat/useConversations";
import type { Attachment } from "@/utils/chat/buildMessages";

interface MessageListProps {
  messages: ConversationMessage[];
  streamingContent?: string;
  onRegenerate?: (index: number) => void;
  onArtifactClick?: (id: string) => void;
}

export default function MessageList({
  messages,
  streamingContent,
  onRegenerate,
  onArtifactClick,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-6 space-y-5">
      {messages.map((msg, idx) => (
        <Message
          key={idx}
          role={msg.role}
          content={msg.content}
          attachments={msg.attachments as Attachment[] | undefined}
          onRegenerate={
            msg.role === "assistant" && onRegenerate
              ? () => onRegenerate(idx)
              : undefined
          }
          onArtifactClick={onArtifactClick}
        />
      ))}
      {streamingContent && (
        <Message
          role="assistant"
          content={streamingContent}
          onArtifactClick={onArtifactClick}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
