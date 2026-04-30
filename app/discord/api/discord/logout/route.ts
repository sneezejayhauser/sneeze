import { NextResponse } from "next/server";
import { getTokenCookieName } from "@/lib/discord/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete(getTokenCookieName());

  return response;
}