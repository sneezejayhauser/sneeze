import { BotCommand } from "@/lib/bot/core/types";
import { customCommandRepo, economyRepo, xpRepo } from "@/lib/bot/db/repositories";

type LeaderboardRow = { user_id: string; xp: number; level: number };

export const communityCommands: BotCommand[] = [
  {
    name: "rank",
    description: "Show your rank information.",
    async execute(ctx) {
      const rows = xpRepo.leaderboard(ctx.guildId) as LeaderboardRow[];
      const entry = rows.find((item: LeaderboardRow) => item.user_id === ctx.userId);
      if (!entry) return { content: "No XP data yet. Start chatting to earn levels." };
      return { content: `Level ${entry.level} (${entry.xp} XP)` };
    },
  },
  {
    name: "leaderboard",
    description: "Show top levels.",
    async execute(ctx) {
      const entries = xpRepo.leaderboard(ctx.guildId) as LeaderboardRow[];
      if (!entries.length) return { content: "Leaderboard is empty." };
      return {
        content: entries.slice(0, 10).map((entry, index) => `${index + 1}. <@${entry.user_id}> • ${entry.xp} XP`).join("\n"),
      };
    },
  },
  {
    name: "balance",
    description: "See your economy balance.",
    async execute(ctx) {
      const coins = economyRepo.addCoins(ctx.guildId, ctx.userId, 0);
      return { content: `You currently have ${coins} coins.` };
    },
  },
  {
    name: "custom",
    description: "Run a custom command.",
    async execute(ctx, options) {
      const name = String(options.name ?? "").toLowerCase();
      const commands = customCommandRepo.list(ctx.guildId) as Array<{ name: string; response: string }>;
      const found = commands.find((item) => item.name.toLowerCase() === name);
      return { content: found?.response ?? `No custom command named ${name}.` };
    },
  },
];

export const unsupportedCommandNames = [
  "kick",
  "ban",
  "timeout",
  "slowmode",
  "lock",
  "unlock",
  "clear",
  "giverole",
  "removerole",
  "userinfo",
  "serverinfo",
  "ping",
  "reactionroles",
  "trivia",
  "poll",
  "modapply",
  "daily",
  "giveaway",
  "profile",
  "setup",
];
