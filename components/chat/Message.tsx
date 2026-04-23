"use client";

import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Attachment } from "@/utils/chat/buildMessages";
import type { ToolRun } from "@/utils/chat/tools";
import { useArtifacts } from "@/hooks/chat/useArtifacts";
import ArtifactCard from "./ArtifactCard";
import ToolCallCard from "./ToolCallCard";

interface MessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  toolRuns?: ToolRun[];
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onArtifactClick?: (id: string) => void;
}

export function AssistantAvatar() {
  return (
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--chat-bg2)]">
      <svg className="h-4 w-4" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M32 8 A24 24 0 1 0 32 56 A16 16 0 1 1 32 24"
          stroke="var(--chat-accent)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function Message({
  role,
  content,
  attachments,
  toolRuns,
  isStreaming,
  onRegenerate,
  onArtifactClick,
}: MessageProps) {
  const [copied, setCopied] = useState(false);
  const artifacts = useArtifacts(role === "assistant" ? content : "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  const isUser = role === "user";
  const hasContent = content.trim().length > 0;
  const hasToolRuns = Boolean(toolRuns && toolRuns.length > 0);

  if (!isUser && !hasContent && !hasToolRuns) {
    return null;
  }

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[80%] rounded-[12px] bg-[var(--chat-user-bubble)] px-4 py-3 text-sm leading-relaxed text-[var(--chat-text)]">
          {attachments && attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="h-16 w-16 overflow-hidden rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg2)]"
                >
                  <img
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex w-full justify-start">
      <div className="flex w-full gap-3">
        <AssistantAvatar />

        <div className="min-w-0 flex-1">
          {hasToolRuns && (
            <div className="mb-3 space-y-2">
              {toolRuns?.map((toolRun) => (
                <ToolCallCard key={`${toolRun.id}-${toolRun.status}`} toolRun={toolRun} />
              ))}
            </div>
          )}

          {hasContent && (
            <div className="chat-markdown text-[14px] leading-7 text-[var(--chat-text)]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre({ children }) {
                    return <pre className="chat-code-block">{children}</pre>;
                  },
                  code(props) {
                    const { children, className, node, ...rest } = props;
                    void node;
                    const isInline = !className;
                    return isInline ? (
                      <code className="chat-inline-code" {...rest}>
                        {children}
                      </code>
                    ) : (
                      <code className={className} {...rest}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && <span className="chat-streaming-cursor">▍</span>}
              {isStreaming && (
                <div className="mt-1 flex gap-1">
                  <div className="h-1 w-1 animate-[chat-typing-dot_1.4s_infinite_both] rounded-full bg-[var(--chat-accent)]/50" />
                  <div className="h-1 w-1 animate-[chat-typing-dot_1.4s_infinite_both_0.2s] rounded-full bg-[var(--chat-accent)]/50" />
                  <div className="h-1 w-1 animate-[chat-typing-dot_1.4s_infinite_both_0.4s] rounded-full bg-[var(--chat-accent)]/50" />
                </div>
              )}
            </div>
          )}

          {artifacts.length > 0 && (
            <div className="mt-3 space-y-2">
              {artifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  onClick={() => onArtifactClick?.(artifact.id)}
                />
              ))}
            </div>
          )}

          {hasContent && (
            <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={handleCopy}
                className="rounded p-1 text-[var(--chat-text3)] transition-colors hover:text-[var(--chat-text2)]"
                aria-label="Copy"
                title="Copy"
              >
                {copied ? (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="rounded p-1 text-[var(--chat-text3)] transition-colors hover:text-[var(--chat-text2)]"
                  aria-label="Regenerate"
                  title="Regenerate"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}

              <button
                className="rounded p-1 text-[var(--chat-text3)] transition-colors hover:text-[var(--chat-text2)]"
                aria-label="Thumbs up"
                title="Thumbs up"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 9V5a3 3 0 00-6 0v4M5 11h4l2 9h6a2 2 0 001.968-1.646l1-5A2 2 0 0018.996 11H14z"
                  />
                </svg>
              </button>

              <button
                className="rounded p-1 text-[var(--chat-text3)] transition-colors hover:text-[var(--chat-text2)]"
                aria-label="Thumbs down"
                title="Thumbs down"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 15v4a3 3 0 006 0v-4m3-2h-4l-2-9H7a2 2 0 00-1.968 1.646l-1 5A2 2 0 005.004 13H10z"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
