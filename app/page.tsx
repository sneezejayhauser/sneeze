import { headers } from "next/headers";
import Layout from "@/components/Layout";
import { getSubdomainFromHost } from "@/lib/subdomain";

const SKILLS = [
  "TypeScript", "Next.js", "React", "Node.js",
  "Tailwind CSS", "Vercel", "PostgreSQL", "Docker",
  "Edge Functions", "REST APIs",
];

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const subdomain = getSubdomainFromHost(host);

  return (
    <Layout subdomain={subdomain}>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <h1 className="text-5xl font-bold tracking-tight">
          yo{" "}
          <span role="img" aria-label="wave">
            👋
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-xl">
          I&apos;m CJ Hauser — a developer building things in public.
        </p>
        <p className="text-slate-500 max-w-lg">
          I like shipping fast, writing clean TypeScript, and making the web feel
          snappy. This site is my personal corner of the internet — a small
          ecosystem of subdomains, each with its own purpose.
        </p>

        {/* Quick nav cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 w-full max-w-xl">
          {[
            { label: "Projects", href: "https://projects.cjhauser.me", emoji: "🔨" },
            { label: "Lab", href: "https://lab.cjhauser.me", emoji: "🧪" },
            { label: "Status", href: "https://status.cjhauser.me", emoji: "📡" },
            { label: "Links", href: "https://links.cjhauser.me", emoji: "🔗" },
          ].map(({ label, href, emoji }) => (
            <a
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-6 py-5 hover:border-amber-500/40 transition-all"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-medium text-slate-300">{label}</span>
            </a>
          ))}
        </div>

        <div className="mt-4 text-sm text-slate-500">
          <a
            href="mailto:sneeze@cjhauser.me"
            className="hover:text-amber-400 transition-colors"
          >
            sneeze@cjhauser.me
          </a>
        </div>
      </section>

      {/* About / skills section */}
      <section className="mt-16 border-t border-white/10 pt-12 space-y-8 max-w-2xl mx-auto text-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">About me</h2>
          <p className="text-slate-400 leading-relaxed">
            I build full-stack web apps, experiment with developer tooling, and
            occasionally write about what I&apos;ve learned. When I&apos;m not coding, I&apos;m
            probably reading, listening to music, or thinking about the next side
            project.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Stack</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {SKILLS.map((skill) => (
              <span
                key={skill}
                className="text-sm bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4 text-sm">
          <a
            href="https://github.com/CloudCompile"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <span>🐙</span> GitHub
          </a>
          <a
            href="https://projects.cjhauser.me"
            className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <span>🔨</span> Projects
          </a>
          <a
            href="mailto:sneeze@cjhauser.me"
            className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <span>✉️</span> Email
          </a>
        </div>
      </section>
    </Layout>
  );
}
