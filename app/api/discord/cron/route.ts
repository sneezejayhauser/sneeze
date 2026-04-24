import { NextResponse } from "next/server";
import { guildRepo } from "@/lib/bot/db/repositories";

export const runtime = "nodejs";

export async function GET() {
  const guilds = guildRepo.listGuilds();
  // TODO: Dispatch scheduled daily content, giveaways, and event rotations per guild.
  return NextResponse.json({ ok: true, processedGuilds: guilds.length, ranAt: new Date().toISOString() });
}
