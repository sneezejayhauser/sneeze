import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const { username, password } = body;

  const expectedUser = process.env.CHAT_USERNAME ?? "";
  const expectedPass = process.env.CHAT_PASSWORD ?? "";

  if (!expectedUser || !expectedPass) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: "chat_auth",
    value: "1",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ success: true });
}
