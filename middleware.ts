import { NextRequest, NextResponse } from "next/server";
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
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};