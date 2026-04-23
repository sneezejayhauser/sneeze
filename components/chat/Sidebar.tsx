"use client";

import { useState, useCallback } from "react";
import { useChatContext } from "@/context/ChatContext";
import SidebarNav from "./SidebarNav";
import ConversationList from "./ConversationList";
import SearchModal from "./SearchModal";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar() {
  const { setCurrentConversationId, activeView, setActiveView, user } = useChatContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setActiveView("chat");
    setMobileOpen(false);
  }, [setCurrentConversationId, setActiveView]);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }, []);

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`chat-sidebar flex h-full w-64 flex-col border-r border-[var(--chat-border)] bg-[var(--chat-bg)] ${
          mobileOpen ? "open" : ""
        } md:static md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[15px] font-medium text-[#e8e6e1]">CUI</span>
          <button
            onClick={handleNewChat}
            className="rounded-md p-1.5 text-[var(--chat-text3)] transition-colors hover:text-[var(--chat-text)]"
            aria-label="New chat"
            title="New chat"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 transition-colors focus-within:border-[var(--chat-border2)]">
            <svg
              className="h-4 w-4 shrink-0 text-[var(--chat-text3)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              readOnly
              value=""
              onFocus={() => setSearchOpen(true)}
              onClick={() => setSearchOpen(true)}
              placeholder="Search chats"
              className="w-full bg-transparent text-sm text-[var(--chat-text2)] outline-none placeholder:text-[var(--chat-text3)]"
            />
          </div>
        </div>

        <SidebarNav />

        <div className="chat-scrollbar flex-1 overflow-y-auto px-2 py-2">
          {activeView === "chat" && <ConversationList onSelect={() => setMobileOpen(false)} />}
        </div>

        <div className="border-t border-[var(--chat-border)] px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-7 w-7 rounded-full"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--chat-bg3)] text-[13px] text-[var(--chat-text)]">
                  {userInitial}
                </div>
              )}
              <span className="text-sm text-[var(--chat-text)]">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md p-1.5 text-[var(--chat-text3)] transition-colors hover:text-[var(--chat-text)]"
              aria-label="Logout"
              title="Logout"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-20 rounded-md bg-[var(--chat-bg2)] p-2 text-[var(--chat-text2)] md:hidden"
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