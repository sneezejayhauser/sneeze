import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const { adminPassword } = await request.json();

    if (!adminPassword || typeof adminPassword !== "string") {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    if (
      !verifyPassword(adminPassword, process.env.NEWS_ADMIN_PASSWORD ?? "")
    ) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
