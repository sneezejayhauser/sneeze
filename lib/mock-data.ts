/**
 * Mock / placeholder data used across all subdomain modules.
 * Replace with real data sources (CMS, API, database, etc.) as the site grows.
 */

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url?: string;
  repo?: string;
  status: "active" | "archived" | "wip";
  stars?: number;
  forks?: number;
  languageColor?: string;
  pushedAt?: string;
}

export const projects: Project[] = [
  {
    id: "sneeze",
    title: "sneeze",
    description: "Personal developer ecosystem running on a single Vercel project with subdomain-based routing.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    repo: "https://github.com/CloudCompile/sneeze",
    status: "active",
    stars: 12,
    forks: 2,
    languageColor: "#3178c6",
    pushedAt: "2025-04-21T21:30:00Z",
  },
  {
    id: "cloudcompile",
    title: "CloudCompile",
    description: "A GitHub organization for open-source tools, experiments, and collaborative side projects.",
    tags: ["Open Source", "GitHub"],
    url: "https://github.com/CloudCompile",
    status: "active",
    stars: 8,
    languageColor: "#cccccc",
    pushedAt: "2025-04-20T14:00:00Z",
  },
  {
    id: "subdomain-router",
    title: "Subdomain Router",
    description: "Lightweight Next.js middleware utility for routing requests to different app modules based on hostname.",
    tags: ["Next.js", "Middleware", "TypeScript"],
    status: "wip",
    stars: 3,
    languageColor: "#3178c6",
    pushedAt: "2025-04-15T09:05:00Z",
  },
  {
    id: "devdash",
    title: "DevDash",
    description: "Personal admin dashboard for monitoring deployments, service health, and site analytics at a glance.",
    tags: ["Dashboard", "Next.js", "TypeScript"],
    status: "wip",
    stars: 1,
    languageColor: "#3178c6",
    pushedAt: "2025-03-28T18:22:00Z",
  },
];

// ---------------------------------------------------------------------------
// Lab experiments
// ---------------------------------------------------------------------------

export interface Experiment {
  id: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  url?: string;
}

export const experiments: Experiment[] = [
  {
    id: "subdomain-routing",
    title: "Subdomain Routing in Next.js",
    description: "Using Next.js middleware + App Router to serve different UI modules from a single deployment based on the incoming hostname.",
    date: "2024-04-01",
    tags: ["Next.js", "Routing", "Vercel"],
    url: "https://github.com/CloudCompile/sneeze",
  },
  {
    id: "turbopack-perf",
    title: "Turbopack Build Performance",
    description: "Benchmarking cold-start build times with Turbopack vs Webpack on a mid-size Next.js app. Turbopack clocked ~4× faster incremental rebuilds.",
    date: "2024-06-15",
    tags: ["Turbopack", "Performance", "Next.js"],
  },
  {
    id: "edge-middleware",
    title: "Edge Middleware for A/B Testing",
    description: "Implemented a lightweight A/B testing layer using Vercel Edge Middleware — cookie-based bucket assignment with zero-latency routing.",
    date: "2024-09-20",
    tags: ["Edge", "A/B Testing", "Vercel"],
  },
  {
    id: "ai-codegen",
    title: "AI-Assisted Code Generation",
    description: "Exploring how far LLM-generated code can go without human review. Spoiler: farther than expected, but review still matters.",
    date: "2025-01-10",
    tags: ["AI", "LLM", "DX"],
  },
  {
    id: "css-layers",
    title: "CSS Cascade Layers with Tailwind",
    description: "Using @layer to integrate Tailwind utilities with custom design tokens without specificity wars.",
    date: "2025-03-05",
    tags: ["CSS", "Tailwind", "Design"],
  },
];

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export type ServiceStatus = "operational" | "degraded" | "outage";

export interface ServiceCheck {
  id: string;
  name: string;
  status: ServiceStatus;
  latencyMs?: number;
  lastChecked: string;
}

export const serviceChecks: ServiceCheck[] = [
  {
    id: "main-site",
    name: "cjhauser.me",
    status: "operational",
    latencyMs: 42,
    lastChecked: new Date().toISOString(),
  },
  {
    id: "projects",
    name: "projects.cjhauser.me",
    status: "operational",
    latencyMs: 45,
    lastChecked: new Date().toISOString(),
  },
  {
    id: "lab",
    name: "lab.cjhauser.me",
    status: "operational",
    latencyMs: 47,
    lastChecked: new Date().toISOString(),
  },
  {
    id: "links",
    name: "links.cjhauser.me",
    status: "operational",
    latencyMs: 44,
    lastChecked: new Date().toISOString(),
  },
  {
    id: "status",
    name: "status.cjhauser.me",
    status: "operational",
    latencyMs: 43,
    lastChecked: new Date().toISOString(),
  },
  {
    id: "admin",
    name: "admin.cjhauser.me",
    status: "operational",
    latencyMs: 49,
    lastChecked: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  description?: string;
  icon?: string;
}

export const links: LinkItem[] = [
  {
    id: "github",
    label: "GitHub",
    url: "https://github.com/CloudCompile",
    description: "Open-source projects and experiments",
    icon: "🐙",
  },
  {
    id: "email",
    label: "Email",
    url: "mailto:sneeze@cjhauser.me",
    description: "Reach out directly",
    icon: "✉️",
  },
  {
    id: "projects",
    label: "Projects",
    url: "https://projects.cjhauser.me",
    description: "What I'm building",
    icon: "🔨",
  },
  {
    id: "lab",
    label: "Lab",
    url: "https://lab.cjhauser.me",
    description: "Experiments and tinkering",
    icon: "🧪",
  },
  {
    id: "status",
    label: "Status",
    url: "https://status.cjhauser.me",
    description: "Service health dashboard",
    icon: "📡",
  },
  {
    id: "rss",
    label: "RSS Feed",
    url: "https://cjhauser.me/rss.xml",
    description: "Subscribe to updates",
    icon: "📰",
  },
];

// ---------------------------------------------------------------------------
// Admin dashboard
// ---------------------------------------------------------------------------

export interface AdminStat {
  id: string;
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: string;
}

export const adminStats: AdminStat[] = [
  {
    id: "projects-total",
    label: "Total Projects",
    value: "4",
    delta: "+1 this month",
    deltaPositive: true,
    icon: "🔨",
  },
  {
    id: "experiments-total",
    label: "Lab Experiments",
    value: "5",
    delta: "+2 this month",
    deltaPositive: true,
    icon: "🧪",
  },
  {
    id: "uptime",
    label: "Avg Uptime",
    value: "99.98%",
    delta: "Last 30 days",
    icon: "📡",
  },
  {
    id: "avg-latency",
    label: "Avg Latency",
    value: "45 ms",
    delta: "-3 ms vs last week",
    deltaPositive: true,
    icon: "⚡",
  },
];

export interface ActivityItem {
  id: string;
  type: "deploy" | "commit" | "alert" | "note";
  message: string;
  timestamp: string;
}

export const activityFeed: ActivityItem[] = [
  {
    id: "act-1",
    type: "deploy",
    message: "Deployed sneeze@main to production (Vercel)",
    timestamp: "2025-04-21T22:10:00Z",
  },
  {
    id: "act-2",
    type: "commit",
    message: "feat: add admin dashboard subdomain",
    timestamp: "2025-04-21T21:45:00Z",
  },
  {
    id: "act-3",
    type: "commit",
    message: "feat: enrich mock data across all pages",
    timestamp: "2025-04-21T21:30:00Z",
  },
  {
    id: "act-4",
    type: "note",
    message: "status.cjhauser.me added to service checks",
    timestamp: "2025-04-20T14:00:00Z",
  },
  {
    id: "act-5",
    type: "deploy",
    message: "Deployed sneeze@main to production (Vercel)",
    timestamp: "2025-04-19T18:22:00Z",
  },
  {
    id: "act-6",
    type: "alert",
    message: "lab.cjhauser.me latency spike — auto-resolved",
    timestamp: "2025-04-15T09:05:00Z",
  },
];
