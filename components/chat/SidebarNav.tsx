"use client";

import { useChatContext } from "@/context/ChatContext";

export default function SidebarNav() {
  const { activeView, setActiveView } = useChatContext();

  const items = [
    {
      key: "chat" as const,
      label: "Chat",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
    {
      key: "agent" as const,
      label: "Agent",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polyline
            points="16 18 22 12 16 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
          <polyline
            points="8 6 2 12 8 18"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="space-y-1 px-2 pb-2">
      {items.map((item) => {
        const isActive = activeView === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setActiveView(item.key)}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? "border-l-2 border-[var(--chat-accent)] bg-[var(--chat-bg3)] text-[var(--chat-text)]"
                : "border-l-2 border-transparent text-[var(--chat-text2)] hover:bg-[var(--chat-bg3)] hover:text-[var(--chat-text)]"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
