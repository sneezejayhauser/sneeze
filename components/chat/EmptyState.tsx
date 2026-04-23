"use client";

interface EmptyStateProps {
  onPromptClick: (text: string) => void;
}

const STARTERS = [
  "Explain how DNS works",
  "Write a React component that fetches data",
  "Summarize the latest trends in AI",
  "Debug this TypeScript error I'm seeing",
];

export default function EmptyState({ onPromptClick }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 h-10 w-10 rounded-full bg-sky-500/20 flex items-center justify-center">
        <svg className="h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-white">How can I help you today?</h2>
      <p className="mt-1 text-sm text-slate-400 max-w-sm">
        Start a conversation or try one of the prompts below.
      </p>
      <div className="mt-6 grid w-full max-w-md gap-2">
        {STARTERS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-4 py-2.5 text-sm text-slate-300 hover:border-sky-500/40 hover:bg-slate-800/80 transition-all text-left"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
