import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customCommandRepo, guildRepo, warningRepo, xpRepo } from "@/lib/bot/db/repositories";

const UpdateSchema = z.object({
  preset: z.enum(["community", "moderation", "economy", "social", "custom"]).optional(),
  levelingEnabled: z.boolean().optional(),
  economyEnabled: z.boolean().optional(),
  profilesEnabled: z.boolean().optional(),
  levelingMultiplier: z.number().min(0.1).max(5).optional(),
  modLogChannelId: z.string().nullable().optional(),
  announcementChannelId: z.string().nullable().optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await context.params;
  const settings = guildRepo.getGuild(guildId) ?? guildRepo.upsertGuild({ guildId });
  return NextResponse.json({
    settings,
    leaderboard: xpRepo.leaderboard(guildId),
    warnings: warningRepo.list(guildId),
    customCommands: customCommandRepo.list(guildId),
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await context.params;
  const patch = UpdateSchema.parse(await request.json());
  const settings = guildRepo.updateGuildSettings(guildId, patch);
  return NextResponse.json({ settings });
}
