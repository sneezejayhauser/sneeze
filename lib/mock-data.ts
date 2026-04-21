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
}

export const projects: Project[] = [
  {
    id: "sneeze",
    title: "sneeze",
    description: "Personal developer ecosystem running on a single Vercel project with subdomain-based routing.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    repo: "https://github.com/CloudCompile/sneeze",
    status: "active",
  },
  {
    id: "example-wip",
    title: "Example WIP",
    description: "A work-in-progress project. Replace this placeholder with real data.",
    tags: ["TBD"],
    status: "wip",
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
  },
  {
    id: "placeholder",
    title: "Placeholder Experiment",
    description: "Add your own experiments here.",
    date: "2024-01-01",
    tags: ["TBD"],
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
];
