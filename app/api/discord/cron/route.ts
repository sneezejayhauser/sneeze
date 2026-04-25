import { NextResponse } from "next/server";
import { guildRepo } from "@/lib/bot/db/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guilds = guildRepo.listGuilds();
  // TODO: Dispatch scheduled daily content, giveaways, and event rotations per guild.
  return NextResponse.json({ ok: true, processedGuilds: guilds.length, ranAt: new Date().toISOString() });
}
