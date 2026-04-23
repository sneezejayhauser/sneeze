"use client";

import { useState, useCallback } from "react";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/chat/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
          window.location.reload();
          return;
        }
        setError("Invalid credentials");
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [username, password]
  );

  return (
    <div className="chat-root flex h-screen w-full items-center justify-center bg-[var(--chat-bg)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--chat-border2)] bg-[var(--chat-bg2)] p-6 shadow-xl">
        <h1 className="text-xl font-bold tracking-tight text-[var(--chat-text)]">Chat</h1>
        <p className="mt-1 text-sm text-[var(--chat-text2)]">Sign in to continue</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--chat-text3)]">Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] px-3 py-2 text-sm text-[var(--chat-text)] outline-none transition-colors focus:border-[var(--chat-border2)]"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--chat-text3)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] px-3 py-2 text-sm text-[var(--chat-text)] outline-none transition-colors focus:border-[var(--chat-border2)]"
              required
            />
          </div>

          {error && <p className="text-sm text-[var(--chat-text2)]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--chat-accent)] px-4 py-2 text-sm font-medium text-[var(--chat-bg)] transition-colors hover:bg-[var(--chat-accent-hover)] disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
