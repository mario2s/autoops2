import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getOrdersPage, type OrderStatus } from '@/db/queries';
import DeleteButton from '@/components/DeleteButton';
import { deleteOrderAction } from '@/actions/delete';

const PAGE_SIZE = 20;

const STATUS_PILLS = [
  { label: 'Booked', value: 'booked' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Awaiting', value: 'awaiting' },
  { label: 'Payment', value: 'payment' },
  { label: 'Done', value: 'done' },
  { label: 'All', value: 'all' },
] as const;

const STATUS_BADGE: Record<string, string> = {
  booked: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  in_progress: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  awaiting: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  payment: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  done: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  booked: 'Booked',
  in_progress: 'In progress',
  awaiting: 'Awaiting',
  payment: 'Payment',
  done: 'Done',
};

function formatDeadline(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function isOverdue(deadline: Date, status: string) {
  return status !== 'done' && deadline < new Date();
}

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  const isAdmin = session.role === 'admin';

  const params = await searchParams;
  const status = params.status || 'in_progress';
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const { orders, total } = await getOrdersPage({
    status: status === 'all' ? null : status,
    page,
    pageSize: PAGE_SIZE,
    mechanicId: session.role === 'mechanic' ? session.userId : undefined,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function pillHref(value: string) {
    return `/dashboard?status=${value}`;
  }

  function pageHref(p: number) {
    return `/dashboard?status=${status}&page=${p}`;
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Orders
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage your repair orders
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          <span aria-hidden="true">+</span> New order
        </Link>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_PILLS.map((pill) => (
          <Link
            key={pill.value}
            href={pillHref(pill.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              status === pill.value
                ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border-transparent'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {pill.label}
          </Link>
        ))}
      </div>

      {/* Orders table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Column headers */}
        <div className={`hidden sm:grid gap-3 px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'grid-cols-[1fr_160px_130px_110px_90px_28px]' : 'grid-cols-[1fr_160px_130px_110px_90px]'}`}>
          {['Vehicle / Client', 'Mechanic', 'Status', 'Deadline', 'Total', ...(isAdmin ? [''] : [])].map((col, i) => (
            <span
              key={i}
              className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide"
            >
              {col}
            </span>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-400 dark:text-zinc-500">
            No orders found
          </div>
        ) : (
          orders.map((order) => {
            const overdue = isOverdue(order.deadline, order.status);
            return (
              <div
                key={order.id}
                className={`relative grid grid-cols-1 gap-2 sm:gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${isAdmin ? 'sm:grid-cols-[1fr_160px_130px_110px_90px_28px]' : 'sm:grid-cols-[1fr_160px_130px_110px_90px]'}`}
              >
                <Link href={`/orders/${order.id}/edit`} className="absolute inset-0" aria-label={`Edit order ${order.vehicleDisplay}`} />
                {/* Vehicle / Client */}
                <div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50 leading-tight">
                    {order.vehicleDisplay}
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {order.clientName}
                  </div>
                </div>

                {/* Mechanic */}
                <div className="text-sm text-zinc-600 dark:text-zinc-400 sm:self-center">
                  <span className="sm:hidden text-xs text-zinc-400 mr-1">Mechanic:</span>
                  {order.mechanicName}
                </div>

                {/* Status badge */}
                <div className="sm:self-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] ?? ''}`}
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>

                {/* Deadline */}
                <div className="sm:self-center">
                  {overdue ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                        className="shrink-0"
                      >
                        <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
                        <line
                          x1="6"
                          y1="3.5"
                          x2="6"
                          y2="6.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                        <circle cx="6" cy="8.5" r="0.6" fill="currentColor" />
                      </svg>
                      {formatDeadline(order.deadline)}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDeadline(order.deadline)}
                    </span>
                  )}
                </div>

                {/* Total */}
                <div className="text-sm text-zinc-600 dark:text-zinc-400 sm:self-center">
                  €{order.total.toFixed(2)}
                </div>

                {/* Delete */}
                {isAdmin && (
                  <div className="relative z-10 sm:self-center">
                    <DeleteButton action={deleteOrderAction.bind(null, order.id)} label="order" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
          {total === 0 ? 'No orders' : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                ←
              </Link>
            )}

            {buildPages(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-xs text-zinc-400">
                  …
                </span>
              ) : (
                <Link
                  key={p}
                  href={pageHref(p)}
                  className={`min-w-[32px] px-2 py-1.5 text-xs rounded-lg border text-center transition-colors ${
                    p === page
                      ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border-transparent font-medium'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {p}
                </Link>
              ),
            )}

            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
