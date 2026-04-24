import { NextResponse } from "next/server";
import { fetchManageableGuilds } from "@/lib/bot/services/discord-api";
import { canManageGuild } from "@/lib/bot/permissions/discord";
import { getDashboardSession } from "@/lib/bot/services/oauth";
import { guildRepo } from "@/lib/bot/db/repositories";

export const runtime = "nodejs";

export async function GET() {
  const session = await getDashboardSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null, guilds: [] });
  }

  const guilds = (await fetchManageableGuilds(session.accessToken)).filter(canManageGuild);
  guilds.forEach((guild) => guildRepo.upsertGuild({ guildId: guild.id, name: guild.name }));

  return NextResponse.json({
    authenticated: true,
    user: { id: session.userId, username: session.username },
    guilds,
  });
}
