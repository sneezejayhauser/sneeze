import { ensureBotMigrations } from "@/lib/bot/db/migrations";
import { getBotDb } from "@/lib/bot/db/client";
import { GuildPreset, GuildSettings, WarningRecord } from "@/lib/bot/types/schema";

function db() {
  ensureBotMigrations();
  return getBotDb();
}

function mapGuild(row: Record<string, unknown>): GuildSettings {
  const validPreset = (row.preset as string) ?? "custom";
  const preset: GuildPreset = ["community", "moderation", "economy", "social", "custom"].includes(validPreset)
    ? (validPreset as GuildPreset)
    : "custom";

  return {
    guildId: String(row.guild_id),
    name: (row.name as string | null) ?? null,
    preset,
    setupCompletedAt: (row.setup_completed_at as string | null) ?? null,
    setupVersion: Number(row.setup_version) || 1,
    levelingEnabled: Boolean(row.leveling_enabled),
    levelingMultiplier: Number(row.leveling_multiplier) || 1,
    economyEnabled: Boolean(row.economy_enabled),
    profilesEnabled: Boolean(row.profiles_enabled),
    modLogChannelId: (row.mod_log_channel_id as string | null) ?? null,
    announcementChannelId: (row.announcement_channel_id as string | null) ?? null,
    updatedAt: String(row.updated_at),
  };
}

export const guildRepo = {
  upsertGuild(input: { guildId: string; name?: string | null; preset?: GuildPreset }) {
    const database = db();
    database
      .prepare(
        `INSERT INTO guild_settings (guild_id, name, preset, updated_at)
         VALUES (@guildId, @name, @preset, CURRENT_TIMESTAMP)
         ON CONFLICT(guild_id) DO UPDATE SET
           name=COALESCE(excluded.name, name),
           preset=COALESCE(excluded.preset, preset),
           updated_at=CURRENT_TIMESTAMP`,
      )
      .run({ guildId: input.guildId, name: input.name ?? null, preset: input.preset ?? "custom" });

    return this.getGuild(input.guildId);
  },
  getGuild(guildId: string) {
    const row = db().prepare("SELECT * FROM guild_settings WHERE guild_id = ?").get(guildId) as Record<string, unknown> | undefined;
    return row ? mapGuild(row) : null;
  },
  listGuilds() {
    const rows = db().prepare("SELECT * FROM guild_settings ORDER BY updated_at DESC").all() as Record<string, unknown>[];
    return rows.map(mapGuild);
  },
  updateGuildSettings(guildId: string, patch: Partial<Omit<GuildSettings, "guildId" | "updatedAt">>) {
    const current = this.getGuild(guildId) ?? this.upsertGuild({ guildId }) ?? this.getGuild(guildId);
    if (!current) throw new Error(`Failed to initialize guild ${guildId}`);
    db()
      .prepare(
        `UPDATE guild_settings
         SET name = @name,
             preset = @preset,
             setup_completed_at = @setupCompletedAt,
             setup_version = @setupVersion,
             leveling_enabled = @levelingEnabled,
             leveling_multiplier = @levelingMultiplier,
             economy_enabled = @economyEnabled,
             profiles_enabled = @profilesEnabled,
             mod_log_channel_id = @modLogChannelId,
             announcement_channel_id = @announcementChannelId,
             updated_at = CURRENT_TIMESTAMP
         WHERE guild_id = @guildId`,
      )
      .run({
        guildId,
        name: patch.name ?? current.name,
        preset: patch.preset ?? current.preset,
        setupCompletedAt: patch.setupCompletedAt ?? current.setupCompletedAt,
        setupVersion: patch.setupVersion ?? current.setupVersion,
        levelingEnabled: Number(patch.levelingEnabled ?? current.levelingEnabled),
        levelingMultiplier: Number(patch.levelingMultiplier ?? current.levelingMultiplier) || 1,
        economyEnabled: Number(patch.economyEnabled ?? current.economyEnabled),
        profilesEnabled: Number(patch.profilesEnabled ?? current.profilesEnabled),
        modLogChannelId: patch.modLogChannelId ?? current.modLogChannelId,
        announcementChannelId: patch.announcementChannelId ?? current.announcementChannelId,
      });

    return this.getGuild(guildId);
  },
};

export const warningRepo = {
  add(guildId: string, userId: string, moderatorId: string, reason: string) {
    db().prepare("INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)").run(guildId, userId, moderatorId, reason);
  },
  list(guildId: string, userId?: string): WarningRecord[] {
    if (userId) {
      return db().prepare("SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC").all(guildId, userId) as WarningRecord[];
    }
    return db().prepare("SELECT * FROM warnings WHERE guild_id = ? ORDER BY created_at DESC LIMIT 100").all(guildId) as WarningRecord[];
  },
  clear(guildId: string, userId: string) {
    return db().prepare("DELETE FROM warnings WHERE guild_id = ? AND user_id = ?").run(guildId, userId).changes;
  },
};

export const xpRepo = {
  addXp(guildId: string, userId: string, amount: number) {
    const existing = db().prepare("SELECT xp, level FROM xp WHERE guild_id = ? AND user_id = ?").get(guildId, userId) as { xp: number; level: number } | undefined;
    const xp = (existing?.xp ?? 0) + amount;
    const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
    db().prepare(
      `INSERT INTO xp (guild_id, user_id, xp, level, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET xp = excluded.xp, level = excluded.level, updated_at = CURRENT_TIMESTAMP`,
    ).run(guildId, userId, xp, level);
    return { xp, level };
  },
  leaderboard(guildId: string) {
    return db().prepare("SELECT user_id, xp, level FROM xp WHERE guild_id = ? ORDER BY xp DESC LIMIT 25").all(guildId);
  },
};

export const economyRepo = {
  addCoins(guildId: string, userId: string, amount: number) {
    const current = db().prepare("SELECT coins FROM economy WHERE guild_id = ? AND user_id = ?").get(guildId, userId) as { coins: number } | undefined;
    const coins = Math.max(0, (current?.coins ?? 0) + amount);
    db().prepare(
      `INSERT INTO economy (guild_id, user_id, coins, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET coins = excluded.coins, updated_at = CURRENT_TIMESTAMP`,
    ).run(guildId, userId, coins);
    return coins;
  },
};

export const profileRepo = {
  upsert(guildId: string, userId: string, profile: { bio?: string; favoriteThings?: string; avatarUrl?: string }) {
    db().prepare(
      `INSERT INTO profiles (guild_id, user_id, bio, favorite_things, avatar_url, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET
       bio=excluded.bio, favorite_things=excluded.favorite_things, avatar_url=excluded.avatar_url, updated_at=CURRENT_TIMESTAMP`,
    ).run(guildId, userId, profile.bio ?? null, profile.favoriteThings ?? null, profile.avatarUrl ?? null);
  },
};

export const customCommandRepo = {
  upsert(guildId: string, name: string, response: string, createdBy: string) {
    db().prepare(
      `INSERT INTO custom_commands (guild_id, name, response, created_by, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(guild_id, name) DO UPDATE SET response=excluded.response, updated_at=CURRENT_TIMESTAMP`,
    ).run(guildId, name, response, createdBy);
  },
  list(guildId: string) {
    return db().prepare("SELECT id, name, response, updated_at FROM custom_commands WHERE guild_id = ? ORDER BY name ASC").all(guildId);
  },
};

export const setupRepo = {
  markStep(guildId: string, preset: GuildPreset, stepKey: string, resourceId?: string) {
    db().prepare(
      `INSERT OR REPLACE INTO setup_steps (guild_id, preset, step_key, resource_id, completed_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    ).run(guildId, preset, stepKey, resourceId ?? null);
  },
  getSteps(guildId: string) {
    return db().prepare("SELECT * FROM setup_steps WHERE guild_id = ? ORDER BY completed_at ASC").all(guildId);
  },
};
