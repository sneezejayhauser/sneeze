import { NextRequest, NextResponse } from "next/server";
import { getSubdomainFromHost } from "@/lib/subdomain";

/**
 * Proxy (Next.js 16+ convention, formerly "middleware") that rewrites
 * incoming requests based on subdomain.
 *
 * Incoming:  projects.cjhauser.me/
 * Rewritten: /projects  (internally, within the same Next.js app)
 *
 * The user's browser URL is unchanged — they still see projects.cjhauser.me.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomainFromHost(host);

  const { pathname } = request.nextUrl;

  // Already on the correct internal path — nothing to do.
  // (avoids infinite rewrite loops)
  const subdomainPath = subdomain === "home" ? "/" : `/${subdomain}`;
  if (pathname.startsWith(subdomainPath) && subdomain !== "home") {
    return NextResponse.next();
  }

  if (subdomain === "home") {
    // Root domain — serve / as-is
    return NextResponse.next();
  }

  // Rewrite to the matching internal route segment.
  // e.g. projects.cjhauser.me/  →  /projects
  //      lab.cjhauser.me/about  →  /lab/about  (future deep paths)
  const rewrittenPath = `/${subdomain}${pathname === "/" ? "" : pathname}`;
  const url = request.nextUrl.clone();
  url.pathname = rewrittenPath;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

