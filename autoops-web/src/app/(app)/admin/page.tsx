import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getMechanicsForAdmin, getAppSetting } from '@/db/queries';
import MechanicsTable from './mechanics-table';
import HourlyRateForm from './hourly-rate-form';

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  const [mechanics, hourlyRate] = await Promise.all([
    getMechanicsForAdmin(),
    getAppSetting('hourly_rate'),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Admin
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage mechanic accounts and shop settings
        </p>
      </div>

      <section className="mb-8">
        <div className="mb-3">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Mechanic Accounts</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            Approve pending registrations, activate or deactivate mechanics
          </p>
        </div>
        <MechanicsTable mechanics={mechanics} />
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Shop Settings</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            Global configuration applied across all orders
          </p>
        </div>
        <HourlyRateForm initialRate={hourlyRate ?? '45.00'} />
      </section>
    </div>
  );
}
