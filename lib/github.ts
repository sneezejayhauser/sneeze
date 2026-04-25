/**
 * GitHub API helpers.
 *
 * Fetches public repositories for a GitHub organization and maps them to the
 * Project shape used across the site.
 *
 * Set GITHUB_TOKEN in your environment / Vercel project settings to raise the
 * API rate limit from 60 to 5,000 requests per hour.
 */

import type { Project } from "@/lib/mock-data";

// ── Language colors (GitHub-like) ────────────────────────────────────────────

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  Shell: "#89e051",
  Swift: "#ffac45",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Vue: "#41b883",
  HTML: "#e34c26",
  CSS: "#563d7c",
};

function getLanguageColor(language: string | null): string | undefined {
  if (!language) return undefined;
  return LANGUAGE_COLORS[language] ?? "#8b949e";
}

// ── Relative time formatter ──────────────────────────────────────────────────

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const rawSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const seconds = Math.abs(rawSeconds);

  if (rawSeconds < 0) {
    if (seconds < 60) return `in ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `in ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `in ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `in ${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `in ${weeks}w`;
    const months = Math.floor(days / 30);
    if (months < 12) return `in ${months}mo`;
    const years = Math.floor(days / 365);
    return `in ${years}y`;
  }

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

// ── GitHub REST API response shape (subset we care about) ─────────────────────

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  topics: string[];
  html_url: string;
  homepage: string | null;
  archived: boolean;
  fork: boolean;
  pushed_at: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

// ── Mapping ───────────────────────────────────────────────────────────────────

function repoToProject(repo: GitHubRepo): Project {
  // Derive status from GitHub metadata
  let status: Project["status"] = "active";
  if (repo.archived) {
    status = "archived";
  } else if (repo.topics.includes("wip")) {
    status = "wip";
  }

  // Build tags: start with the primary language, then add topics (skip "wip"
  // since it's already encoded in status). Cap at 6 to keep the UI tidy.
  const tags: string[] = [];
  if (repo.language) tags.push(repo.language);
  for (const topic of repo.topics) {
    if (topic !== "wip" && !tags.includes(topic) && tags.length < 6) {
      tags.push(topic);
    }
  }

  return {
    id: repo.name,
    title: repo.name,
    description: repo.description ?? "No description provided.",
    tags,
    repo: repo.html_url,
    url: repo.homepage ?? undefined,
    status,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    languageColor: getLanguageColor(repo.language),
    pushedAt: repo.pushed_at,
  };
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

/**
 * Returns all non-fork public repos for the given GitHub org, sorted by most
 * recently pushed. Results are cached by Next.js and revalidated every hour.
 *
 * Returns `null` on any API error so the caller can fall back gracefully.
 */
export async function fetchOrgRepos(org: string): Promise<Project[] | null> {
  const reqHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    reqHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?per_page=100&sort=pushed&direction=desc&type=public`,
      {
        headers: reqHeaders,
        next: { revalidate: 3600 }, // ISR: re-fetch at most once per hour
      }
    );
  } catch (err) {
    console.error("[github] fetch failed:", err);
    return null;
  }

  if (!res.ok) {
    console.error(
      `[github] API error ${res.status} for org "${org}":`,
      await res.text().catch(() => "")
    );
    return null;
  }

  const repos: GitHubRepo[] = await res.json();

  return repos
    .filter((r) => !r.fork)
    .map(repoToProject);
}
