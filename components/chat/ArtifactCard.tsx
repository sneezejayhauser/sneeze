"use client";

import type { Artifact } from "@/utils/chat/parseArtifacts";

interface ArtifactCardProps {
  artifact: Artifact;
  onClick?: () => void;
}

export default function ArtifactCard({ artifact, onClick }: ArtifactCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg2)] px-3 py-2 text-left transition-colors hover:bg-[var(--chat-bg3)]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--chat-bg3)] text-[var(--chat-text2)]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-[var(--chat-text)]">{artifact.filename}</p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--chat-text3)]">{artifact.language}</p>
      </div>
    </button>
  );
}
