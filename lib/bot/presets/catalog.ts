import { GuildPreset } from "@/lib/bot/types/schema";

export type PresetDefinition = {
  id: GuildPreset;
  name: string;
  description: string;
  starterRoles: string[];
  starterChannels: string[];
  settings: {
    levelingEnabled: boolean;
    economyEnabled: boolean;
    profilesEnabled: boolean;
    levelingMultiplier: number;
  };
};

export const PRESETS: PresetDefinition[] = [
  {
    id: "community",
    name: "Chill Community",
    description: "Balanced starter setup for social communities.",
    starterRoles: ["Member", "Moderator"],
    starterChannels: ["welcome", "general", "introductions"],
    settings: { levelingEnabled: true, economyEnabled: true, profilesEnabled: true, levelingMultiplier: 1 },
  },
  {
    id: "moderation",
    name: "Moderation Heavy",
    description: "More structure and moderation-oriented defaults.",
    starterRoles: ["Member", "Mod", "Admin"],
    starterChannels: ["rules", "announcements", "mod-log", "general"],
    settings: { levelingEnabled: false, economyEnabled: false, profilesEnabled: true, levelingMultiplier: 1 },
  },
  {
    id: "economy",
    name: "Economy Focused",
    description: "Turns on rewards and economy-centric starter defaults.",
    starterRoles: ["Member", "Trader"],
    starterChannels: ["general", "shop", "trading-floor"],
    settings: { levelingEnabled: true, economyEnabled: true, profilesEnabled: true, levelingMultiplier: 1.2 },
  },
  {
    id: "social",
    name: "XP Social",
    description: "Great for rank climbing and engagement.",
    starterRoles: ["Member", "Level Coach"],
    starterChannels: ["general", "memes", "media"],
    settings: { levelingEnabled: true, economyEnabled: false, profilesEnabled: true, levelingMultiplier: 1.5 },
  },
  {
    id: "custom",
    name: "Custom / Default",
    description: "No forced channels; choose features from dashboard.",
    starterRoles: [],
    starterChannels: [],
    settings: { levelingEnabled: true, economyEnabled: true, profilesEnabled: true, levelingMultiplier: 1 },
  },
];

export function getPreset(presetId: GuildPreset) {
  return PRESETS.find((p) => p.id === presetId) ?? PRESETS[PRESETS.length - 1];
}
