"use client";

import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { Attachment } from "@/utils/chat/buildMessages";
import { useArtifacts } from "@/hooks/chat/useArtifacts";
import ArtifactCard from "./ArtifactCard";

interface MessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  onRegenerate?: () => void;
  onArtifactClick?: (id: string) => void;
}

export default function Message({
  role,
  content,
  attachments,
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

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-sky-600 text-white"
            : "bg-slate-800/60 text-slate-200"
        }`}
      >
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="h-16 w-16 rounded-lg overflow-hidden border border-slate-600/40 bg-slate-900"
              >
                <img src={att.dataUrl} alt={att.name} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { children, className, node, ...rest } = props;
                  void node;
                  const match = /language-(\w+)/.exec(className || "");
                  const language = match ? match[1] : "";
                  const isInline = !className;
                  return isInline ? (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      language={language || "text"}
                      PreTag="div"
                      customStyle={{
                        background: "rgb(15 23 42)",
                        borderRadius: "0.5rem",
                        padding: "0.75rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {artifacts.length > 0 && (
          <div className="mt-3 space-y-2">
            {artifacts.map((a) => (
              <ArtifactCard key={a.id} artifact={a} onClick={() => onArtifactClick?.(a.id)} />
            ))}
          </div>
        )}

        {!isUser && (
          <div className="mt-2 flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
              aria-label="Copy"
              title="Copy"
            >
              {copied ? (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                aria-label="Regenerate"
                title="Regenerate"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
