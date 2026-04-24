import { NextResponse } from "next/server";
import { getDiscordLoginUrl } from "@/lib/bot/services/discord-api";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.redirect(getDiscordLoginUrl());
}
