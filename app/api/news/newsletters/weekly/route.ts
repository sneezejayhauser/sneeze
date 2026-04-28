import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || bearer !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL is not configured" }, { status: 500 });
    }

    const adminPassword = process.env.NEWS_ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: "NEWS_ADMIN_PASSWORD is not configured" }, { status: 500 });
    }

    const response = await fetch(`${appUrl}/api/news/newsletters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword,
        weekEnding: new Date().toISOString(),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to run weekly newsletter job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
