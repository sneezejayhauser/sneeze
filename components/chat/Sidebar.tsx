"use client";

import { useState, useCallback } from "react";
import { useChatContext } from "@/context/ChatContext";
import SidebarNav from "./SidebarNav";
import ConversationList from "./ConversationList";
import SearchModal from "./SearchModal";

export default function Sidebar() {
  const { setCurrentConversationId, activeView, setActiveView } = useChatContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setActiveView("chat");
    setMobileOpen(false);
  }, [setCurrentConversationId, setActiveView]);

  const handleLogout = useCallback(async () => {
    await fetch("/chat/api/logout", { method: "POST" });
    window.location.reload();
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`chat-sidebar flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-full ${
          mobileOpen ? "open" : ""
        } md:translate-x-0 md:static`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-slate-200">CUI</span>
          <button
            onClick={handleNewChat}
            className="rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            aria-label="New chat"
            title="New chat"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search chats
          </button>
        </div>

        <SidebarNav />

        <div className="flex-1 overflow-y-auto chat-scrollbar px-2 py-2">
          {activeView === "chat" && <ConversationList onSelect={() => setMobileOpen(false)} />}
        </div>

        <div className="border-t border-slate-800 px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
                CJ
              </div>
              <span className="text-sm text-slate-300">CJ</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
              aria-label="Logout"
              title="Logout"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-20 rounded-md bg-slate-800 p-2 text-slate-300 hover:text-white"
        aria-label="Open sidebar"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
