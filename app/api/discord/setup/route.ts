import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runSafeSetup } from "@/lib/bot/services/setup";

const SetupSchema = z.object({
  guildId: z.string(),
  preset: z.enum(["community", "moderation", "economy", "social", "custom"]),
  existingRoles: z.array(z.string()).default([]),
  existingChannels: z.array(z.string()).default([]),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = SetupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const payload = parsed.data;
  const result = runSafeSetup(payload.guildId, payload.preset, {
    roles: payload.existingRoles,
    channels: payload.existingChannels,
  });
  return NextResponse.json(result);
}
