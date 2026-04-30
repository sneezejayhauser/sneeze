import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { StoredToken, DiscordChannelWithRecipient } from "@/lib/discord/types";
import { refreshAccessToken, getTokenCookieName } from "@/lib/discord/auth";

const DISCORD_API_BASE = "https://discord.com/api/v10";

async function getValidToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<string | null> {
  const tokenCookie = cookieStore.get(getTokenCookieName())?.value;

  if (!tokenCookie) {
    return null;
  }

  try {
    const stored: StoredToken = JSON.parse(tokenCookie);

    // Check if token needs refresh
    if (Date.now() >= stored.expires_at - 60000) {
      // Refresh if expiring in < 1 minute
      const newToken = await refreshAccessToken(stored.refresh_token);
      stored.access_token = newToken.access_token;
      stored.refresh_token = newToken.refresh_token;
      stored.expires_at = Date.now() + newToken.expires_in * 1000;

      // Update cookie with new token
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

    return stored.access_token;
  } catch {
    return null;
  }
}

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = await getValidToken(cookieStore);

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me/channels`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Discord API error:", error);
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: response.status }
      );
    }

    const channels = await response.json() as Array<{
      id: string;
      type: number;
      last_message_id: string | null;
      recipients: Array<{
        id: string;
        username: string;
        discriminator: string;
        global_name: string | null;
        avatar: string | null;
      }>;
    }>;

    // Transform to include recipient info for DM channels
    const dmChannels: DiscordChannelWithRecipient[] = channels
      .filter((ch) => ch.type === 1) // DM channel type
      .map((ch) => ({
        ...ch,
        recipient: ch.recipients[0] || {
          id: "unknown",
          username: "Unknown User",
          discriminator: "0",
          global_name: null,
          avatar: null,
        },
      }));

    return NextResponse.json(dmChannels);
  } catch (err) {
    console.error("Error fetching channels:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}