"use client";

import { useEffect, useState } from "react";

type GuildData = {
  settings: {
    guildId: string;
    name: string | null;
    preset: string;
    levelingEnabled: boolean;
    economyEnabled: boolean;
    profilesEnabled: boolean;
    levelingMultiplier: number;
    modLogChannelId: string | null;
    announcementChannelId: string | null;
  };
  leaderboard: Array<{ user_id: string; xp: number; level: number }>;
  warnings: Array<{ id: number; user_id: string; reason: string }>;
  customCommands: Array<{ id: number; name: string; response: string }>;
};

const presets = ["community", "moderation", "economy", "social", "custom"] as const;

export function GuildSettingsEditor({ guildId }: { guildId: string }) {
  const [data, setData] = useState<GuildData | null>(null);

  useEffect(() => {
    fetch(`/api/nb/guilds/${guildId}`, { cache: "no-store" }).then(async (res) => setData(await res.json()));
  }, [guildId]);

  async function save(patch: Record<string, unknown>) {
    const res = await fetch(`/api/nb/guilds/${guildId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const payload = await res.json();
    setData((current) => (current ? { ...current, settings: payload.settings } : current));
  }

  if (!data) return <p className="p-8">Loading guild settings…</p>;

  const { settings } = data;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">{settings.name ?? guildId}</h1>

      <section className="space-y-2">
        <h2 className="font-medium">Preset</h2>
        <select value={settings.preset} onChange={(e) => void save({ preset: e.target.value })}>
          {presets.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Core Systems</h2>
        <label className="block">
          <input type="checkbox" checked={settings.levelingEnabled} onChange={(e) => void save({ levelingEnabled: e.target.checked })} /> Leveling
        </label>
        <label className="block">
          <input type="checkbox" checked={settings.economyEnabled} onChange={(e) => void save({ economyEnabled: e.target.checked })} /> Economy
        </label>
        <label className="block">
          <input type="checkbox" checked={settings.profilesEnabled} onChange={(e) => void save({ profilesEnabled: e.target.checked })} /> Profiles
        </label>
      </section>

      <section>
        <h2 className="font-medium">Leaderboard</h2>
        <ul>{data.leaderboard.slice(0, 5).map((row) => <li key={row.user_id}>{row.user_id}: {row.xp} XP</li>)}</ul>
      </section>

      <section>
        <h2 className="font-medium">Warnings</h2>
        <ul>{data.warnings.slice(0, 5).map((row) => <li key={row.id}>User {row.user_id}: {row.reason}</li>)}</ul>
      </section>

      <section>
        <h2 className="font-medium">Custom Commands</h2>
        <ul>{data.customCommands.slice(0, 5).map((row) => <li key={row.id}>/{row.name} → {row.response}</li>)}</ul>
      </section>
    </div>
  );
}
