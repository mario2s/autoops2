import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getInsightsData, InsightsTopItem } from '@/db/queries';

function fmt(value: number) {
  return `€${Math.round(value).toLocaleString('en-US')}`;
}

function TopCard({
  title,
  items,
}: {
  title: string;
  items: InsightsTopItem[];
}) {
  const topRevenue = items[0]?.revenue ?? 1;
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">YTD revenue generated</div>
      </div>
      <div className="py-1.5">
        {items.length === 0 ? (
          <div className="px-4 py-4 text-xs text-zinc-400 dark:text-zinc-500">No data yet</div>
        ) : (
          items.map((item, i) => {
            const barPct = Math.round((item.revenue / topRevenue) * 100);
            const isFirst = i === 0;
            return (
              <div
                key={item.name}
                className="flex items-center px-4 py-2 gap-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <span
                  className={`text-xs w-3.5 text-center shrink-0 tabular-nums ${
                    isFirst
                      ? 'text-amber-500 dark:text-amber-400 font-semibold'
                      : 'text-zinc-300 dark:text-zinc-600'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{item.name}</div>
                  <div className="w-full h-0.5 bg-zinc-100 dark:bg-zinc-800 rounded mt-1.5">
                    <div
                      className={`h-0.5 rounded ${isFirst ? 'bg-amber-400 dark:bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0 tabular-nums">
                  {fmt(item.revenue)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default async function InsightsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  const year = new Date().getFullYear();
  const data = await getInsightsData();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Insights
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Year-to-date business performance — {year}
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            YTD Revenue
          </div>
          <div className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {fmt(data.ytdRevenue)}
          </div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
            From completed orders — Jan 1 to today
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-5 py-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Backlog Revenue
          </div>
          <div className="text-3xl font-semibold tracking-tight text-amber-500 dark:text-amber-400">
            {fmt(data.backlogRevenue)}
          </div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
            Open orders not yet marked as Done
          </div>
        </div>
      </div>

      {/* Top 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TopCard title="Top 5 Clients" items={data.topClients} />
        <TopCard title="Top 5 Services" items={data.topServices} />
        <TopCard title="Top 5 Parts" items={data.topParts} />
      </div>
    </div>
  );
}
