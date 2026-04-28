import { NextRequest, NextResponse } from "next/server";
import { getSubdomainFromHost } from "@/lib/subdomain";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomainFromHost(host);
  const { pathname } = request.nextUrl;

  // Exclude API routes from subdomain rewriting
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Apply subdomain proxy logic
  const subdomainPath = subdomain === "home" ? "/" : `/${subdomain}`;
  const isAlreadyOnSubdomainPath = pathname.startsWith(subdomainPath) && subdomain !== "home";

  if (subdomain === "home" || isAlreadyOnSubdomainPath) {
    return NextResponse.next();
  }

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
