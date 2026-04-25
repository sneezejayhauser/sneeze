"use client";

import { useState } from "react";
import type { Artifact } from "@/utils/chat/parseArtifacts";

interface ArtifactPanelProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export default function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
  const [tab, setTab] = useState<"code" | "preview">("code");

  if (!artifact) return null;

  const isPreviewable = artifact.type === "html" || artifact.type === "svg";

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--chat-border)] bg-[var(--chat-bg2)] shadow-2xl md:w-[420px]">
      <div className="flex items-center justify-between border-b border-[var(--chat-border)] px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--chat-text)]">{artifact.filename}</p>
          <p className="text-xs text-[var(--chat-text3)]">{artifact.language}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-[var(--chat-text3)] transition-colors hover:text-[var(--chat-text)]"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isPreviewable && (
        <div className="flex border-b border-[var(--chat-border)]">
          <button
            onClick={() => setTab("code")}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              tab === "code"
                ? "border-b-2 border-[var(--chat-accent)] text-[var(--chat-text)]"
                : "text-[var(--chat-text3)] hover:text-[var(--chat-text2)]"
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setTab("preview")}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              tab === "preview"
                ? "border-b-2 border-[var(--chat-accent)] text-[var(--chat-text)]"
                : "text-[var(--chat-text3)] hover:text-[var(--chat-text2)]"
            }`}
          >
            Preview
          </button>
        </div>
      )}

      <div className="chat-scrollbar flex-1 overflow-y-auto">
        {tab === "code" && (
          <pre className="whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-[var(--chat-text)]">
            {artifact.content}
          </pre>
        )}

        {tab === "preview" && isPreviewable && (
          <iframe
            title={artifact.filename}
            srcDoc={
              artifact.type === "svg"
                ? `<!DOCTYPE html><html><body style=\"margin:0;background:#0f0f0f\">${artifact.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")}</body></html>`
                : artifact.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            }
            className="h-full min-h-[400px] w-full border-0"
            sandbox=""
          />
        )}
      </div>
    </div>
  );
}
