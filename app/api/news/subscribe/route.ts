import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEmail } from "@/lib/validation";

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

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const normalizedEmail = email.toLowerCase();

    // Use upsert with on_conflict to prevent race condition
    // If a unique constraint exists on email, this will handle duplicates atomically
    const { error } = await supabase.from("news_subscribers").upsert(
      {
        email: normalizedEmail,
        unsubscribed_at: null,
        subscribed_at: new Date().toISOString(),
      },
      {
        onConflict: "email",
      }
    );

    if (error) {
      // If upsert not supported, fall back to check-then-act pattern
      if (error.message.includes("onConflict")) {
        const { data: existing } = await supabase
          .from("news_subscribers")
          .select("id, unsubscribed_at")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existing && !existing.unsubscribed_at) {
          // Already subscribed
          return NextResponse.json({ success: true });
        }

        if (existing && existing.unsubscribed_at) {
          // Re-subscribe
          const { error: updateError } = await supabase
            .from("news_subscribers")
            .update({
              unsubscribed_at: null,
              subscribed_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("news_subscribers")
            .insert({ email: normalizedEmail });
          if (insertError) throw insertError;
        }
      } else {
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to subscribe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
