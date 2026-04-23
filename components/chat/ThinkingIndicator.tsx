"use client";

import { AssistantAvatar } from "./Message";

export default function ThinkingIndicator() {
  return (
    <div className="flex w-full gap-3 py-4">
      <AssistantAvatar />
      <div className="flex items-center space-x-1 px-3 py-2 bg-[var(--chat-bg2)] rounded-2xl rounded-tl-none border border-[var(--chat-border)]">
        <div className="h-1.5 w-1.5 animate-[chat-thinking-bounce_1.4s_infinite_both] rounded-full bg-[var(--chat-text3)]" />
        <div className="h-1.5 w-1.5 animate-[chat-thinking-bounce_1.4s_infinite_both_0.2s] rounded-full bg-[var(--chat-text3)]" />
        <div className="h-1.5 w-1.5 animate-[chat-thinking-bounce_1.4s_infinite_both_0.4s] rounded-full bg-[var(--chat-text3)]" />
      </div>
    </div>
  );
}
