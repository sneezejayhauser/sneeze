import { guildRepo, setupRepo } from "@/lib/bot/db/repositories";
import { getPreset } from "@/lib/bot/presets/catalog";
import { GuildPreset } from "@/lib/bot/types/schema";

export type SetupActionResult = {
  guildId: string;
  preset: GuildPreset;
  createdRoles: string[];
  createdChannels: string[];
  skippedRoles: string[];
  skippedChannels: string[];
};

export function runSafeSetup(guildId: string, presetId: GuildPreset, existing: { roles: string[]; channels: string[] }) {
  const preset = getPreset(presetId);
  const createdRoles: string[] = [];
  const createdChannels: string[] = [];
  const skippedRoles: string[] = [];
  const skippedChannels: string[] = [];

  preset.starterRoles.forEach((role) => {
    if (existing.roles.includes(role)) {
      skippedRoles.push(role);
      return;
    }
    createdRoles.push(role);
    setupRepo.markStep(guildId, presetId, `role:${role}`, role);
  });

  preset.starterChannels.forEach((channel) => {
    if (existing.channels.includes(channel)) {
      skippedChannels.push(channel);
      return;
    }
    createdChannels.push(channel);
    setupRepo.markStep(guildId, presetId, `channel:${channel}`, channel);
  });

  guildRepo.updateGuildSettings(guildId, {
    preset: presetId,
    setupCompletedAt: new Date().toISOString(),
    levelingEnabled: preset.settings.levelingEnabled,
    economyEnabled: preset.settings.economyEnabled,
    profilesEnabled: preset.settings.profilesEnabled,
    levelingMultiplier: preset.settings.levelingMultiplier,
  });

  return {
    guildId,
    preset: presetId,
    createdRoles,
    createdChannels,
    skippedRoles,
    skippedChannels,
  } satisfies SetupActionResult;
}
