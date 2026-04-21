import { headers } from "next/headers";
import Layout from "@/components/Layout";
import { getSubdomainFromHost } from "@/lib/subdomain";

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const subdomain = getSubdomainFromHost(host);

  return (
    <Layout subdomain={subdomain}>
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
        <p className="text-slate-500">
          Explore the ecosystem using the links above.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: "Projects", href: "https://projects.cjhauser.me", emoji: "🔨" },
            { label: "Lab", href: "https://lab.cjhauser.me", emoji: "🧪" },
            { label: "Status", href: "https://status.cjhauser.me", emoji: "📡" },
            { label: "Links", href: "https://links.cjhauser.me", emoji: "🔗" },
          ].map(({ label, href, emoji }) => (
            <a
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-5 hover:border-sky-500/40 hover:bg-slate-800/80 transition-all"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-medium text-slate-300">{label}</span>
            </a>
          ))}
        </div>

        <div className="mt-8 text-sm text-slate-500">
          <a
            href="mailto:sneeze@cjhauser.me"
            className="hover:text-sky-400 transition-colors"
          >
            sneeze@cjhauser.me
          </a>
        </div>
      </section>
    </Layout>
  );
}
