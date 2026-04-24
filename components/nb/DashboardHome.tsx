"use client";

import { useEffect, useState } from "react";

type Guild = { id: string; name: string };

type MeResponse = {
  authenticated: boolean;
  user: { id: string; username: string } | null;
  guilds: Guild[];
};

export function DashboardHome() {
  const [data, setData] = useState<MeResponse | null>(null);

  useEffect(() => {
    fetch("/api/nb/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => setData(payload));
  }, []);

  if (!data) return <p className="p-8">Loading dashboard…</p>;

  if (!data.authenticated) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-semibold">NB Bot Dashboard</h1>
        <p>Sign in with Discord to manage any server where you have owner, administrator, or manage server permissions.</p>
        <a className="inline-block rounded bg-black px-4 py-2 text-white" href="/api/nb/oauth/login">
          Continue with Discord
        </a>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Welcome, {data.user?.username}</h1>
      <p>Manage server-specific bot configuration below.</p>
      <ul className="space-y-2">
        {data.guilds.map((guild) => (
          <li key={guild.id}>
            <a href={`/nb/guild/${guild.id}`} className="underline">
              {guild.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
