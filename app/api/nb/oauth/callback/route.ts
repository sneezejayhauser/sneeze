import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, fetchDiscordUser } from "@/lib/bot/services/discord-api";
import { setDashboardSession } from "@/lib/bot/services/oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  try {
    const token = await exchangeCodeForToken(code);
    const user = await fetchDiscordUser(token.access_token);
    await setDashboardSession({ userId: user.id, username: user.username, accessToken: token.access_token });
  } catch {
    return NextResponse.json({ error: "OAuth failed" }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/nb", request.url));
}
