import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Check for existing active subscription
    const { data: existing } = await supabase
      .from("news_subscribers")
      .select("id, unsubscribed_at")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing && !existing.unsubscribed_at) {
      // Already subscribed — return success silently to avoid email enumeration
      return NextResponse.json({ success: true });
    }

    if (existing && existing.unsubscribed_at) {
      // Re-subscribe
      const { error } = await supabase
        .from("news_subscribers")
        .update({ unsubscribed_at: null, subscribed_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("news_subscribers")
        .insert({ email: email.toLowerCase() });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to subscribe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
