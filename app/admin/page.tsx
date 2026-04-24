import { headers } from "next/headers";
import Layout from "@/components/Layout";
import { getSubdomainFromHost } from "@/lib/subdomain";
import {
  adminStats,
  activityFeed,
  serviceChecks,
  type ActivityItem,
} from "@/lib/mock-data";

const ACTIVITY_ICONS: Record<ActivityItem["type"], string> = {
  deploy: "🚀",
  commit: "💾",
  alert: "⚠️",
  note: "📝",
};

const ACTIVITY_COLORS: Record<ActivityItem["type"], string> = {
  deploy: "text-amber-400",
  commit: "text-emerald-400",
  alert: "text-amber-400",
  note: "text-slate-400",
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const subdomain = getSubdomainFromHost(host);

  const operationalCount = serviceChecks.filter(
    (s) => s.status === "operational"
  ).length;

  return (
    <Layout subdomain={subdomain}>
      <div className="space-y-10">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p className="mt-2 text-slate-400">
            Overview of the cjhauser.me ecosystem.
          </p>
        </header>

        {/* Stats grid */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            At a glance
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {adminStats.map((stat) => (
              <div
                key={stat.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    {stat.label}
                  </span>
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                {stat.delta && (
                  <p
                    className={`text-xs ${
                      stat.deltaPositive === true
                        ? "text-emerald-400"
                        : stat.deltaPositive === false
                          ? "text-red-400"
                          : "text-slate-500"
                    }`}
                  >
                    {stat.delta}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Services quick view */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Services
            </h2>
            <span className="text-xs text-slate-500">
              {operationalCount}/{serviceChecks.length} operational
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {serviceChecks.map((check) => (
              <div
                key={check.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      check.status === "operational"
                        ? "bg-emerald-400"
                        : check.status === "degraded"
                          ? "bg-amber-400"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm font-medium">{check.name}</span>
                </div>
                {check.latencyMs !== undefined && (
                  <span className="text-xs text-slate-500">
                    {check.latencyMs} ms
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Activity feed */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Recent activity
          </h2>
          <ol className="relative border-l border-white/10 space-y-0">
            {activityFeed.map((item) => (
              <li key={item.id} className="ml-4 pb-6 last:pb-0">
                <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#050a08] border border-white/10 text-xs">
                  {ACTIVITY_ICONS[item.type]}
                </span>
                <div className="ml-2">
                  <p className={`text-sm font-medium ${ACTIVITY_COLORS[item.type]}`}>
                    {item.message}
                  </p>
                  <time className="text-xs text-slate-600">
                    {formatTimestamp(item.timestamp)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Layout>
  );
}
