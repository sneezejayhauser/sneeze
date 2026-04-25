import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  try {
    if (code) {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    } else if (token_hash && type === "magiclink") {
      // Handle magic link verification
      const supabase = await createClient();
      await supabase.auth.verifyOtp({
        type: "email",
        token_hash,
      });
    }
  } catch {
    // ignore auth errors
  }

  // Redirect to chat page
  return NextResponse.redirect(new URL("/chat", requestUrl.origin));
}