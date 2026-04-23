"use client";

import { useState } from "react";

export default function AgentView() {
  const [text, setText] = useState("");
  const [comingSoon, setComingSoon] = useState(false);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[var(--chat-bg)]">
      <div className="border-b border-[var(--chat-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--chat-text)]">Agent</h2>
      </div>

      <div className="chat-scrollbar flex-1 overflow-y-auto px-6 py-10">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--chat-border)] bg-[var(--chat-bg2)]">
            <svg className="h-6 w-6 text-[var(--chat-text3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--chat-text)]">Coding Agent</h3>
          <p className="mt-2 text-sm text-[var(--chat-text2)]">
            A fully autonomous coding assistant that can plan, write, and execute code.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--chat-border)] bg-[var(--chat-bg2)] px-4 py-1.5 text-xs text-[var(--chat-text2)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--chat-accent)]" />
            Coming soon
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--chat-border)] px-4 py-3">
        {comingSoon && (
          <div className="mb-2 rounded-md bg-[var(--chat-accent-dim)] px-3 py-1.5 text-center text-xs text-[var(--chat-text2)]">
            Agent mode — Coming soon
          </div>
        )}
        <div className="chat-input-pill flex items-end gap-2 px-3 py-2">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Describe a task for the agent…"
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm text-[var(--chat-text)] outline-none placeholder:text-[var(--chat-text3)]"
            style={{ minHeight: "1.5rem", maxHeight: "8rem" }}
          />
          <button
            disabled
            onClick={() => setComingSoon(true)}
            className="rounded-full bg-[var(--chat-bg3)] px-3 py-1.5 text-xs font-medium text-[var(--chat-text2)]"
          >
            Coming soon
          </button>
        </div>
      </div>
    </div>
  );
}
