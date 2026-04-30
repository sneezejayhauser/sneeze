"use client";

import { useState, useEffect, useRef } from "react";
import type { DiscordChannelWithRecipient, DiscordMessage } from "@/lib/discord/types";

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAvatarUrl(userId: string, avatarHash: string | null): string {
  if (!avatarHash) {
    const hashNum = userId.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    const defaultIndex = Math.abs(hashNum) % 6;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  }
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=64`;
}

async function loadChannels(): Promise<{
  channels?: DiscordChannelWithRecipient[];
  error?: string;
}> {
  try {
    const res = await fetch("/api/discord/channels");
    if (!res.ok) {
      if (res.status === 401) {
        return { error: "not_authenticated" };
      }
      return { error: "Failed to fetch channels" };
    }
    const data = await res.json();
    return { channels: data };
  } catch {
    return { error: "Failed to load channels" };
  }
}

async function loadMessages(channelId: string): Promise<DiscordMessage[]> {
  const res = await fetch(`/api/discord/channels/${channelId}/messages`);
  if (!res.ok) {
    throw new Error("Failed to fetch messages");
  }
  return res.json();
}

async function loadCurrentUser(): Promise<string | null> {
  try {
    const res = await fetch("/api/discord/user");
    if (res.ok) {
      const data = await res.json();
      return data.id;
    }
    return null;
  } catch {
    return null;
  }
}

export default function DiscordPage() {
  const [channels, setChannels] = useState<DiscordChannelWithRecipient[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<DiscordChannelWithRecipient | null>(null);
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const init = async () => {
      const [userId, channelResult] = await Promise.all([
        loadCurrentUser(),
        loadChannels(),
      ]);

      setCurrentUserId(userId);

      if (channelResult.error) {
        setError(channelResult.error);
      } else if (channelResult.channels) {
        setChannels(channelResult.channels);
      }
      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;

    const poll = async () => {
      try {
        const msgs = await loadMessages(selectedChannel.id);
        setMessages(msgs);
      } catch {
        // Silently fail on polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectChannel = (channel: DiscordChannelWithRecipient) => {
    setSelectedChannel(channel);
    setLoadingMessages(true);
    setMessages([]);

    loadMessages(channel.id)
      .then(setMessages)
      .catch(() => setError("Failed to load messages"))
      .finally(() => setLoadingMessages(false));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      const res = await fetch(
        `/api/discord/channels/${selectedChannel.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
      }
    } catch {
      setError("Failed to send message");
      setNewMessage(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    loadChannels().then((result) => {
      if (result.error) {
        setError(result.error);
      } else if (result.channels) {
        setChannels(result.channels);
      }
      setLoading(false);
    });
  };

  if (error === "not_authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">💬</div>
          <h1 className="text-2xl font-bold">Connect Discord</h1>
          <p className="text-slate-400 max-w-md">
            Sign in with Discord to view and send direct messages.
          </p>
          <a
            href="/api/discord/auth"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Login with Discord
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && error !== "not_authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-slate-400">{error}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div
        className={`${
          selectedChannel ? "hidden md:flex" : "flex"
        } flex-col w-full md:w-72 bg-[#1e1f22] border-r border-white/5`}
      >
        <div className="p-4 border-b border-white/5">
          <h2 className="font-semibold text-sm text-slate-300 uppercase tracking-wide">
            Direct Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {channels.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No direct messages</p>
          ) : (
            channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => selectChannel(channel)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${
                  selectedChannel?.id === channel.id ? "bg-white/10" : ""
                }`}
              >
                <img
                  src={getAvatarUrl(channel.recipient.id, channel.recipient.avatar)}
                  alt={channel.recipient.username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {channel.recipient.global_name || channel.recipient.username}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    @{channel.recipient.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedChannel ? (
        <div className="flex-1 flex flex-col bg-[#2b2d31]">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#313338]">
            <button
              onClick={() => setSelectedChannel(null)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <img
              src={getAvatarUrl(
                selectedChannel.recipient.id,
                selectedChannel.recipient.avatar
              )}
              alt={selectedChannel.recipient.username}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="font-medium">
                {selectedChannel.recipient.global_name ||
                  selectedChannel.recipient.username}
              </p>
              <p className="text-xs text-slate-500">
                @{selectedChannel.recipient.username}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingMessages ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.author.id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <img
                      src={getAvatarUrl(msg.author.id, msg.author.avatar)}
                      alt={msg.author.username}
                      className="w-10 h-10 rounded-full shrink-0"
                    />
                    <div className={`max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {msg.author.global_name || msg.author.username}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? "bg-[#5865F2] text-white rounded-br-md"
                            : "bg-[#383a40] rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-white/5">
            <div className="flex gap-3">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                rows={1}
                className="flex-1 px-4 py-3 bg-[#383a40] border border-white/10 rounded-xl resize-none focus:outline-none focus:border-amber-500/50 placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-3 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-[#2b2d31]">
          <div className="text-center text-slate-500">
            <div className="text-5xl mb-4">💬</div>
            <p>Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}