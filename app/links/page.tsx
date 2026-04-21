import { headers } from "next/headers";
import Layout from "@/components/Layout";
import { getSubdomainFromHost } from "@/lib/subdomain";
import { links } from "@/lib/mock-data";

export default async function LinksPage() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const subdomain = getSubdomainFromHost(host);

  return (
    <Layout subdomain={subdomain}>
      <div className="space-y-8 max-w-lg mx-auto">
        <header className="text-center">
          <div className="text-5xl mb-3">🔗</div>
          <h1 className="text-3xl font-bold tracking-tight">CJ Hauser</h1>
          <p className="mt-2 text-slate-400">Everything in one place.</p>
        </header>

        <ul className="space-y-3">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target={link.url.startsWith("mailto:") ? undefined : "_blank"}
                rel={link.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                className="flex items-center gap-4 w-full rounded-xl border border-slate-700/60 bg-slate-800/40 px-5 py-4 hover:border-sky-500/40 hover:bg-slate-800/80 transition-all group"
              >
                {link.icon && (
                  <span className="text-2xl shrink-0">{link.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium group-hover:text-sky-400 transition-colors">
                    {link.label}
                  </p>
                  {link.description && (
                    <p className="text-sm text-slate-500 truncate">
                      {link.description}
                    </p>
                  )}
                </div>
                <svg
                  className="h-4 w-4 text-slate-600 group-hover:text-sky-400 shrink-0 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
