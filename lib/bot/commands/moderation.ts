import { BotCommand } from "@/lib/bot/core/types";
import { warningRepo } from "@/lib/bot/db/repositories";

type WarningRow = { reason: string };

export const moderationCommands: BotCommand[] = [
  {
    name: "warn",
    description: "Issue a warning to a user.",
    async execute(ctx, options) {
      const targetUserId = String(options.userId ?? "");
      const reason = String(options.reason ?? "No reason provided");
      warningRepo.add(ctx.guildId, targetUserId, ctx.userId, reason);
      return { content: `Warned <@${targetUserId}>: ${reason}` };
    },
  },
  {
    name: "warnings",
    description: "List warnings for a user.",
    async execute(ctx, options) {
      const targetUserId = String(options.userId ?? ctx.userId);
      const warnings = warningRepo.list(ctx.guildId, targetUserId) as WarningRow[];
      if (warnings.length === 0) return { content: "No warnings found." };
      return {
        content: warnings
          .slice(0, 5)
          .map((warning: WarningRow, i) => `#${i + 1} ${warning.reason}`)
          .join("\n"),
      };
    },
  },
  {
    name: "clearwarns",
    description: "Clear warnings for a user.",
    async execute(ctx, options) {
      const targetUserId = String(options.userId ?? "");
      const count = warningRepo.clear(ctx.guildId, targetUserId);
      return { content: `Cleared ${count} warnings for <@${targetUserId}>.` };
    },
  },
];
