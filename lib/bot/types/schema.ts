export type GuildPreset = "community" | "moderation" | "economy" | "social" | "custom";

export type GuildSettings = {
  guildId: string;
  name: string | null;
  preset: GuildPreset;
  setupCompletedAt: string | null;
  setupVersion: number;
  levelingEnabled: boolean;
  levelingMultiplier: number;
  economyEnabled: boolean;
  profilesEnabled: boolean;
  modLogChannelId: string | null;
  announcementChannelId: string | null;
  updatedAt: string;
};

export type WarningRecord = {
  id: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  createdAt: string;
};

export type XpRecord = {
  guildId: string;
  userId: string;
  xp: number;
  level: number;
  updatedAt: string;
};

export type EconomyRecord = {
  guildId: string;
  userId: string;
  coins: number;
  updatedAt: string;
};

export type ProfileRecord = {
  guildId: string;
  userId: string;
  bio: string | null;
  favoriteThings: string | null;
  avatarUrl: string | null;
  updatedAt: string;
};

export type ReactionRoleRecord = {
  id: number;
  guildId: string;
  channelId: string;
  messageId: string;
  emoji: string;
  roleId: string;
  createdAt: string;
};

export type CustomCommandRecord = {
  id: number;
  guildId: string;
  name: string;
  response: string;
  createdBy: string;
  updatedAt: string;
};
