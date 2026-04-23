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
      <svg className="mb-5 h-12 w-12" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M32 8 A24 24 0 1 0 32 56 A16 16 0 1 1 32 24"
          stroke="var(--chat-accent)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      <h2 className="text-[20px] font-light text-[var(--chat-text)]">How can I help you today?</h2>
      <p className="mt-1 text-[13px] text-[var(--chat-text2)]">
        Start a conversation or try one of the prompts below.
      </p>

      <div className="mt-6 grid w-full max-w-[560px] grid-cols-2 gap-2">
        {STARTERS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="rounded-[12px] border border-[var(--chat-border)] bg-[var(--chat-bg2)] px-4 py-2.5 text-left text-[13px] text-[var(--chat-text2)] transition-all duration-[120ms] ease-out hover:bg-[var(--chat-bg3)] hover:text-[var(--chat-text)]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
