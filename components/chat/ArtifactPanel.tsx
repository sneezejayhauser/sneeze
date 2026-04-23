"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
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
    <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{artifact.filename}</p>
          <p className="text-xs text-slate-500">{artifact.language}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isPreviewable && (
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setTab("code")}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              tab === "code"
                ? "text-sky-400 border-b-2 border-sky-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setTab("preview")}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              tab === "preview"
                ? "text-sky-400 border-b-2 border-sky-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Preview
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto chat-scrollbar">
        {tab === "code" && (
          <SyntaxHighlighter
            language={artifact.language || "text"}
            PreTag="div"
            customStyle={{
              background: "transparent",
              margin: 0,
              padding: "1rem",
              fontSize: "0.8rem",
            }}
          >
            {artifact.content}
          </SyntaxHighlighter>
        )}
        {tab === "preview" && isPreviewable && (
          <iframe
            title={artifact.filename}
            srcDoc={
              artifact.type === "svg"
                ? `<!DOCTYPE html><html><body style="margin:0;background:#0f172a">${artifact.content}</body></html>`
                : artifact.content
            }
            className="w-full h-full min-h-[400px] border-0"
            sandbox="allow-scripts"
          />
        )}
      </div>
    </div>
  );
}
