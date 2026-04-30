import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { StoredToken } from "@/lib/discord/types";
import { getDiscordUser, refreshAccessToken, getTokenCookieName } from "@/lib/discord/auth";

export async function GET() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(getTokenCookieName())?.value;

  if (!tokenCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stored: StoredToken = JSON.parse(tokenCookie);

    // Check if token needs refresh
    let accessToken = stored.access_token;
    if (Date.now() >= stored.expires_at - 60000) {
      const newToken = await refreshAccessToken(stored.refresh_token);
      accessToken = newToken.access_token;
      stored.access_token = newToken.access_token;
      stored.refresh_token = newToken.refresh_token;
      stored.expires_at = Date.now() + newToken.expires_in * 1000;

      cookieStore.set(
        getTokenCookieName(),
        JSON.stringify(stored),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        }
      );
    }

    const user = await getDiscordUser(accessToken);
    return NextResponse.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}