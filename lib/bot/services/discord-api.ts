import { parseGuilds } from "@/lib/bot/permissions/discord";

const DISCORD_API_BASE = "https://discord.com/api/v10";

export function getDiscordLoginUrl() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirect = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !redirect) throw new Error("Missing Discord OAuth config");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirect,
    scope: "identify guilds",
    prompt: "consent",
  });
  return `${DISCORD_API_BASE}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirect = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirect) throw new Error("Missing Discord OAuth config");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirect,
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${response.status}`);
  }

  return response.json() as Promise<{ access_token: string; token_type: string; expires_in: number }>;
}

export async function fetchDiscordUser(accessToken: string) {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch Discord user");
  return response.json() as Promise<{ id: string; username: string }>;
}

export async function fetchManageableGuilds(accessToken: string) {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch guilds");
  return parseGuilds(await response.json());
}
