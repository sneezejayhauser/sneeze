"use client";

import { useState } from "react";

export default function AgentView() {
  const [text, setText] = useState("");
  const [comingSoon, setComingSoon] = useState(false);

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-slate-950">
      <div className="flex items-center border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-200">Agent</h2>
      </div>
      <div className="flex-1 overflow-y-auto chat-scrollbar px-6 py-10">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700/60">
            <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white">Coding Agent</h3>
          <p className="mt-2 text-sm text-slate-400">
            A fully autonomous coding assistant that can plan, write, and execute code.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/40 px-4 py-1.5 text-xs text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            Coming soon
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-3">
        {comingSoon && (
          <div className="mb-2 rounded-md bg-amber-500/20 px-3 py-1.5 text-xs text-amber-400 text-center">
            Agent mode — Coming soon
          </div>
        )}
        <div className="chat-input-pill flex items-end gap-2 px-3 py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe a task for the agent…"
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm text-white outline-none placeholder:text-slate-500"
            style={{ minHeight: "1.5rem", maxHeight: "8rem" }}
          />
          <button
            disabled
            onClick={() => setComingSoon(true)}
            className="rounded-full bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300"
          >
            Coming soon
          </button>
        </div>
      </div>
    </div>
  );
}
