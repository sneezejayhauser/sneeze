import { NextResponse } from "next/server";
import { createState, getDiscordOAuthUrl } from "@/lib/discord/auth";

export async function GET() {
  try {
    const state = createState();
    const url = getDiscordOAuthUrl(state);

    const response = NextResponse.redirect(url);
    response.cookies.set("discord_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}