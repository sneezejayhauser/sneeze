import { NextRequest, NextResponse } from "next/server";
import { validateEmail } from "@/lib/validation";
import { extractErrorMessage, getNewsServiceClient } from "@/lib/news/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = getNewsServiceClient();
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
    const message = extractErrorMessage(err, "Failed to subscribe");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
