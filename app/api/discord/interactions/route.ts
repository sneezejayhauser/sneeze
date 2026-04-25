import { NextRequest, NextResponse } from "next/server";
import { verifyKey } from "discord-interactions";
import { executeCommand } from "@/lib/bot/core/command-registry";
import { guildRepo } from "@/lib/bot/db/repositories";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "Missing DISCORD_PUBLIC_KEY" }, { status: 500 });
  }

  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text();

  if (!signature || !timestamp || !verifyKey(body, signature, timestamp, publicKey)) {
    return NextResponse.json({ error: "Bad request signature" }, { status: 401 });
  }

  let interaction: {
    type: number;
    data?: { name?: string; options?: Array<{ name: string; value: unknown }> };
    guild_id?: string;
    member?: { user?: { id?: string } };
  };
  try {
    interaction = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  if (interaction.type !== 2 || !interaction.data?.name || !interaction.guild_id) {
    return NextResponse.json({ type: 4, data: { content: "Unsupported interaction", flags: 64 } });
  }

  guildRepo.upsertGuild({ guildId: interaction.guild_id });

  const options = Object.fromEntries((interaction.data.options ?? []).map((opt) => [opt.name, opt.value]));
  const result = await executeCommand(interaction.data.name, {
    guildId: interaction.guild_id,
    userId: interaction.member?.user?.id ?? "unknown",
  }, options);

  return NextResponse.json({ type: 4, data: { content: result.content, flags: result.ephemeral ? 64 : undefined } });
}
