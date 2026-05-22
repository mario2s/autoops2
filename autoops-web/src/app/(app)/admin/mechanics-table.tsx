'use client';

import { useState } from 'react';
import { approveAccount, rejectAccount, deactivateAccount, activateAccount } from '@/actions/admin';

type Status = 'pending' | 'active' | 'inactive';

type Mechanic = {
  id: string;
  name: string;
  email: string;
  status: Status;
  createdAt: string;
  orderCount: number;
};

function StatusBadge({ status }: { status: Status }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
        Pending
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
      Inactive
    </span>
  );
}

export default function MechanicsTable({ mechanics }: { mechanics: Mechanic[] }) {
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    Object.fromEntries(mechanics.map((m) => [m.id, m.status])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(
    mechId: string,
    action: 'approve' | 'reject' | 'deactivate' | 'activate',
  ) {
    const prevStatus = statuses[mechId];
    const newStatus: Status = action === 'approve' || action === 'activate' ? 'active' : 'inactive';

    setStatuses((s) => ({ ...s, [mechId]: newStatus }));
    setErrors((e) => ({ ...e, [mechId]: '' }));
    setLoading(mechId);

    const actionFn = { approve: approveAccount, reject: rejectAccount, deactivate: deactivateAccount, activate: activateAccount }[action];

    try {
      const result = await actionFn(mechId);
      if (result.error) {
        setStatuses((s) => ({ ...s, [mechId]: prevStatus }));
        setErrors((e) => ({ ...e, [mechId]: result.error! }));
      }
    } finally {
      setLoading(null);
    }
  }

  if (mechanics.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-6 py-10 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No mechanic accounts yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-300 dark:border-zinc-700 overflow-hidden">
      {/* Column headers — desktop only */}
      <div className="hidden md:grid grid-cols-[1fr_140px_100px_120px_190px] gap-4 px-5 py-2.5 border-b border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Mechanic</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Registered</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Orders</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Status</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Actions</span>
      </div>

      {mechanics.map((mechanic) => {
        const status = statuses[mechanic.id];
        const error = errors[mechanic.id];
        const isLoading = loading === mechanic.id;

        return (
          <div key={mechanic.id} className="border-b border-zinc-200 dark:border-zinc-700/60 last:border-0">
            <div className="flex flex-col md:grid md:grid-cols-[1fr_140px_100px_120px_190px] gap-x-4 gap-y-2 px-5 py-3.5 md:items-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
              {/* Name + email */}
              <div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{mechanic.name}</div>
                <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{mechanic.email}</div>
              </div>

              {/* Registered */}
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="md:hidden text-zinc-400 dark:text-zinc-500">Registered: </span>
                {mechanic.createdAt}
              </div>

              {/* Orders */}
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {status === 'pending' ? '—' : `${mechanic.orderCount} orders`}
              </div>

              {/* Status badge */}
              <div>
                <StatusBadge status={status} />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(mechanic.id, 'approve')}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(mechanic.id, 'reject')}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-800 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {status === 'active' && (
                  <button
                    onClick={() => handleAction(mechanic.id, 'deactivate')}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-800 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
                  >
                    Deactivate
                  </button>
                )}
                {status === 'inactive' && (
                  <button
                    onClick={() => handleAction(mechanic.id, 'activate')}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
            {error && (
              <div className="px-5 pb-3 -mt-1 text-xs text-red-500 dark:text-red-400">{error}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
