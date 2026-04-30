import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { StoredToken, DiscordMessage } from "@/lib/discord/types";
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

    if (Date.now() >= stored.expires_at - 60000) {
      const newToken = await refreshAccessToken(stored.refresh_token);
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

    return stored.access_token;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const cookieStore = await cookies();
  const accessToken = await getValidToken(cookieStore);

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "50";

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/channels/${channelId}/messages?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Discord API error:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: response.status }
      );
    }

    const messages = await response.json() as DiscordMessage[];

    // Sort by timestamp ascending (oldest first)
    messages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return NextResponse.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const cookieStore = await cookies();
  const accessToken = await getValidToken(cookieStore);

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId } = await params;

  try {
    const body = await request.json();
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${DISCORD_API_BASE}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Discord API error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: response.status }
      );
    }

    const message = await response.json() as DiscordMessage;
    return NextResponse.json(message);
  } catch (err) {
    console.error("Error sending message:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}