import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSubdomainFromHost } from "@/lib/subdomain";

async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return;
  }

  try {
    const supabaseResponse = NextResponse.next();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.getUser();

    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
  } catch {
    // Session refresh failed, continue anyway.
  }
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomainFromHost(host);
  const { pathname } = request.nextUrl;
  const isChatRequest = subdomain === "chat" && (pathname === "/" || pathname.startsWith("/chat"));

  // Apply subdomain proxy logic
  const subdomainPath = subdomain === "home" ? "/" : `/${subdomain}`;
  const isAlreadyOnSubdomainPath = pathname.startsWith(subdomainPath) && subdomain !== "home";

  if (subdomain === "home" || isAlreadyOnSubdomainPath) {
    const response = NextResponse.next();
    if (isChatRequest) {
      await refreshSupabaseSession(request, response);
    }
    return response;
  }

  const rewrittenPath = `/${subdomain}${pathname === "/" ? "" : pathname}`;
  const url = request.nextUrl.clone();
  url.pathname = rewrittenPath;

  const response = NextResponse.rewrite(url);
  if (isChatRequest) {
    await refreshSupabaseSession(request, response);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
