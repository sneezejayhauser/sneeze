import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForTokens,
  storeToken,
  getTokenCookieName,
  getTokenCookieMaxAge,
} from "@/lib/discord/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors from Discord
  if (error) {
    return NextResponse.redirect(
      new URL(`/discord?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate required params
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/discord?error=missing_params", request.url)
    );
  }

  // Verify state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("discord_oauth_state")?.value;

  if (!savedState || state !== savedState) {
    return NextResponse.redirect(
      new URL("/discord?error=invalid_state", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);
    const storedToken = storeToken(tokenResponse);

    // Store token in HTTP-only cookie
    const response = NextResponse.redirect(
      new URL("/discord", request.url)
    );

    response.cookies.set(
      getTokenCookieName(),
      JSON.stringify(storedToken),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: getTokenCookieMaxAge(),
        path: "/",
      }
    );

    // Clear state cookie
    response.cookies.delete("discord_oauth_state");

    return response;
  } catch (err) {
    console.error("Token exchange error:", err);
    return NextResponse.redirect(
      new URL("/discord?error=auth_failed", request.url)
    );
  }
}