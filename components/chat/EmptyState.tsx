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
      <p className="mb-4 inline-flex rounded-full border border-[var(--chat-border)] px-3 py-1 text-xs text-[var(--chat-text2)]">
        Free plan · Upgrade
      </p>
      <h2 className="text-[46px] font-light tracking-tight text-[var(--chat-text)]">
        <span className="mr-2 text-[var(--chat-accent)]">✶</span>
        Welcome back
      </h2>

      <div className="mt-7 grid w-full max-w-[640px] grid-cols-2 gap-2">
        {STARTERS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="rounded-full border border-[var(--chat-border)] bg-[var(--chat-bg2)] px-4 py-2 text-center text-[12px] text-[var(--chat-text2)] transition-all duration-[120ms] ease-out hover:bg-[var(--chat-bg3)] hover:text-[var(--chat-text)]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
