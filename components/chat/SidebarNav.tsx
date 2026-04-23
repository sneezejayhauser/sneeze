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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      key: "agent" as const,
      label: "Agent",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="px-2 pb-2 space-y-1">
      {items.map((item) => {
        const isActive = activeView === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setActiveView(item.key)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-sky-500/20 text-sky-400"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
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
