import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customCommandRepo, guildRepo, warningRepo, xpRepo } from "@/lib/bot/db/repositories";
import { getDashboardSession } from "@/lib/bot/services/oauth";

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
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { guildId } = await context.params;
  const settings = guildRepo.getGuild(guildId);
  return NextResponse.json({
    settings,
    leaderboard: xpRepo.leaderboard(guildId),
    warnings: warningRepo.list(guildId),
    customCommands: customCommandRepo.list(guildId),
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ guildId: string }> }) {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { guildId } = await context.params;
  const patch = UpdateSchema.safeParse(await request.json());
  if (!patch.success) {
    return NextResponse.json({ error: patch.error.format() }, { status: 400 });
  }
  const settings = guildRepo.updateGuildSettings(guildId, patch.data);
  return NextResponse.json({ settings });
}
