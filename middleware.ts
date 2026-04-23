import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSubdomainFromHost } from "@/lib/subdomain";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomainFromHost(host);
  const { pathname } = request.nextUrl;

  // Apply subdomain proxy logic
  const subdomainPath = subdomain === "home" ? "/" : `/${subdomain}`;
  if (pathname.startsWith(subdomainPath) && subdomain !== "home") {
    // Already on the correct internal path — nothing to do.
    return NextResponse.next();
  }

  if (subdomain === "home") {
    return NextResponse.next();
  }

  // Rewrite to the matching internal route segment
  const rewrittenPath = `/${subdomain}${pathname === "/" ? "" : pathname}`;
  const url = request.nextUrl.clone();
  url.pathname = rewrittenPath;

  // For /chat routes, refresh the session before rewriting
  if (pathname.startsWith("/chat")) {
    const response = NextResponse.rewrite(url);

    // Get Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    // Only refresh session if Supabase is configured
    if (supabaseUrl && supabaseKey) {
      try {
        // Create response with cookie handling for session refresh
        const supabaseResponse = NextResponse.next();
        
        // Create server client for session refresh
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

        // Refresh the session - this will update cookies if needed
        await supabase.auth.getUser();

        // Copy over any cookies set by the supabase client
        const setCookies = supabaseResponse.headers.get("set-cookie");
        if (setCookies) {
          response.headers.append("set-cookie", setCookies);
        }
      } catch {
        // Session refresh failed, continue anyway
      }
    }

    return response;
  }

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};