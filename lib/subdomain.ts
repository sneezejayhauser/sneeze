/**
 * Subdomain detection helper.
 *
 * Parses the incoming hostname and returns the subdomain label.
 * Works in both Next.js middleware (Edge runtime) and Server Components.
 *
 * Mapping:
 *   cjhauser.me          → "home"
 *   projects.cjhauser.me → "projects"
 *   lab.cjhauser.me      → "lab"
 *   status.cjhauser.me   → "status"
 *   links.cjhauser.me    → "links"
 *
 * Unknown / localhost fallback → "home"
 */

export type SubdomainKey = "home" | "projects" | "lab" | "status" | "links" | "admin" | "chat";

const ROOT_DOMAIN = "cjhauser.me";

const SUBDOMAIN_MAP: Record<string, SubdomainKey> = {
  projects: "projects",
  lab: "lab",
  status: "status",
  links: "links",
  admin: "admin",
  chat: "chat",
};

/**
 * Given a full hostname (e.g. "projects.cjhauser.me"), return the
 * SubdomainKey that corresponds to it.
 */
export function getSubdomainFromHost(host: string): SubdomainKey {
  // Strip port if present (useful in development)
  const hostname = host.split(":")[0];

  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return "home";
  }

  // Extract the first label (everything before the first dot)
  const firstLabel = hostname.split(".")[0];

  return SUBDOMAIN_MAP[firstLabel] ?? "home";
}

/**
 * Build a full URL for a given subdomain key, useful for generating
 * navbar hrefs that are always subdomain-based.
 */
export function getSubdomainHref(key: SubdomainKey): string {
  if (key === "home") return `https://${ROOT_DOMAIN}`;
  return `https://${key}.${ROOT_DOMAIN}`;
}
