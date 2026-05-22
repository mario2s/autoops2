import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getPartsCatalogPage, getClientsPage, getVehiclesPage } from '@/db/queries';
import CatalogSearch from './catalog-search';
import DeleteButton from '@/components/DeleteButton';
import { deleteCatalogPartAction, deleteClientAction, deleteVehicleAction } from '@/actions/delete';

const PAGE_SIZE = 20;

type Tab = 'parts' | 'clients' | 'vehicles';

const TABS: { label: string; value: Tab }[] = [
  { label: 'Parts', value: 'parts' },
  { label: 'Clients', value: 'clients' },
  { label: 'Vehicles', value: 'vehicles' },
];

const ADD_LABELS: Record<Tab, string> = {
  parts: 'Add part',
  clients: 'Add client',
  vehicles: 'Add vehicle',
};

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div
      className="hidden sm:grid gap-3 px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800"
      style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}
    >
      {cols.map((col) => (
        <span key={col} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
          {col}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-zinc-400 dark:text-zinc-500">
      {message}
    </div>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  const isAdmin = session.role === 'admin';

  const params = await searchParams;
  const tab = (params.tab as Tab) || 'parts';
  const search = params.q || '';
  const page = Math.max(1, parseInt(params.page || '1', 10));

  function tabHref(t: Tab) {
    return `/catalog?tab=${t}`;
  }

  function pageHref(p: number) {
    const sp = new URLSearchParams({ tab, ...(search && { q: search }), page: String(p) });
    return `/catalog?${sp}`;
  }

  let content: React.ReactNode;
  let total = 0;

  if (tab === 'parts') {
    const result = await getPartsCatalogPage({ search, page, pageSize: PAGE_SIZE });
    total = result.total;

    content = (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className={`hidden sm:grid gap-3 px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'grid-cols-[1fr_180px_150px_40px]' : 'grid-cols-[1fr_180px_150px]'}`}>
          {['Part name', 'Created by', 'Date added', ...(isAdmin ? [''] : [])].map((col, i) => (
            <span key={i} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{col}</span>
          ))}
        </div>
        {result.parts.length === 0 ? (
          <EmptyState message="No parts found" />
        ) : (
          result.parts.map((part) => (
            <div
              key={part.id}
              className={`grid grid-cols-1 gap-1 sm:gap-3 sm:items-center px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${isAdmin ? 'sm:grid-cols-[1fr_180px_150px_40px]' : 'sm:grid-cols-[1fr_180px_150px]'}`}
            >
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{part.name}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{part.createdBy}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(part.createdAt)}</div>
              {isAdmin && <DeleteButton action={deleteCatalogPartAction.bind(null, part.id)} label="part" />}
            </div>
          ))
        )}
      </div>
    );
  } else if (tab === 'clients') {
    const result = await getClientsPage({ search, page, pageSize: PAGE_SIZE });
    total = result.total;

    content = (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className={`hidden sm:grid gap-3 px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'grid-cols-[1fr_150px_220px_80px_40px]' : 'grid-cols-[1fr_150px_220px_80px]'}`}>
          {['Name', 'Phone', 'Email', 'Orders', ...(isAdmin ? [''] : [])].map((col, i) => (
            <span key={i} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{col}</span>
          ))}
        </div>
        {result.clients.length === 0 ? (
          <EmptyState message="No clients found" />
        ) : (
          result.clients.map((client) => (
            <div
              key={client.id}
              className={`relative grid grid-cols-1 gap-1 sm:gap-3 sm:items-center px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer ${isAdmin ? 'sm:grid-cols-[1fr_150px_220px_80px_40px]' : 'sm:grid-cols-[1fr_150px_220px_80px]'}`}
            >
              <Link href={`/clients/${client.id}/edit`} className="absolute inset-0 z-0" aria-label={`Edit ${client.name}`} />
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50 pointer-events-none">{client.name}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 pointer-events-none">{client.phone ?? '—'}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 pointer-events-none">{client.email ?? '—'}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 pointer-events-none">{client.orderCount}</div>
              {isAdmin && <div className="relative z-10"><DeleteButton action={deleteClientAction.bind(null, client.id)} label="client" /></div>}
            </div>
          ))
        )}
      </div>
    );
  } else {
    const result = await getVehiclesPage({ search, page, pageSize: PAGE_SIZE });
    total = result.total;

    content = (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className={`hidden sm:grid gap-3 px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'grid-cols-[1fr_180px_160px_40px]' : 'grid-cols-[1fr_180px_160px]'}`}>
          {['Plate / Description', 'Client', 'Make / Model', ...(isAdmin ? [''] : [])].map((col, i) => (
            <span key={i} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{col}</span>
          ))}
        </div>
        {result.vehicles.length === 0 ? (
          <EmptyState message="No vehicles found" />
        ) : (
          result.vehicles.map((v) => (
            <div
              key={v.id}
              className={`relative grid grid-cols-1 gap-1 sm:gap-3 sm:items-center px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer ${isAdmin ? 'sm:grid-cols-[1fr_180px_160px_40px]' : 'sm:grid-cols-[1fr_180px_160px]'}`}
            >
              <Link href={`/vehicles/${v.id}/edit`} className="absolute inset-0 z-0" aria-label={`Edit ${v.licensePlate ?? v.description}`} />
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50 pointer-events-none">
                {v.licensePlate ?? v.description}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 pointer-events-none">{v.clientName}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 pointer-events-none">
                {[v.make, v.model].filter(Boolean).join(' ') || '—'}
              </div>
              {isAdmin && <div className="relative z-10"><DeleteButton action={deleteVehicleAction.bind(null, v.id)} label="vehicle" /></div>}
            </div>
          ))
        )}
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Catalog
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage parts, clients, and vehicles
          </p>
        </div>
        <Link
          href={`/${tab}/new`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          <span aria-hidden="true">+</span> {ADD_LABELS[tab]}
        </Link>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0 mb-6 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={tabHref(t.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.value
                ? 'border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5">
        <CatalogSearch tab={tab} defaultValue={search} />
      </div>

      {/* Tab content */}
      {content}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
          {total === 0 ? 'No results' : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
