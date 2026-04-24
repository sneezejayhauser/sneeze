import { headers } from "next/headers";
import Layout from "@/components/Layout";
import { getSubdomainFromHost } from "@/lib/subdomain";
import { experiments } from "@/lib/mock-data";

export default async function LabPage() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const subdomain = getSubdomainFromHost(host);

  return (
    <Layout subdomain={subdomain}>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Lab</h1>
          <p className="mt-2 text-slate-400">
            Experiments, tinkering, and half-baked ideas worth sharing.
          </p>
        </header>

        <ul className="space-y-4">
          {experiments.map((exp) => (
            <li
              key={exp.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 hover:border-amber-500/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-semibold">
                    {exp.url ? (
                      <a
                        href={exp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-amber-400 transition-colors"
                      >
                        {exp.title} →
                      </a>
                    ) : (
                      exp.title
                    )}
                  </h2>
                  <p className="text-sm text-slate-400">{exp.description}</p>
                </div>
                <time
                  dateTime={exp.date}
                  className="shrink-0 text-xs text-slate-500 pt-0.5"
                >
                  {exp.date}
                </time>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {exp.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-white/5 text-slate-300 px-2 py-0.5 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
