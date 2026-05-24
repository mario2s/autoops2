'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateClientAction } from '@/actions/orders';
import ClientVehicleModal from './ClientVehicleModal';

const inputCls =
  'w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-colors';

type Vehicle = { id: string; licensePlate: string | null; description: string | null };

type Props = {
  id: string;
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  initialNotes: string;
  vehicles: Vehicle[];
  unknownVehicles: Vehicle[];
};

export default function EditClientForm({ id, initialName, initialPhone, initialEmail, initialNotes, vehicles, unknownVehicles }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [vehicleModal, setVehicleModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    const result = await updateClientAction(id, { name, phone, email, notes });
    setSaving(false);
    if ('error' in result) { setError(result.error); return; }
    router.push('/catalog?tab=clients');
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl px-6 py-8">
      {vehicleModal && (
        <ClientVehicleModal
          clientId={id}
          unknownVehicles={unknownVehicles}
          onClose={() => setVehicleModal(false)}
        />
      )}
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Edit Client
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Update client details
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Client details</span>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoFocus
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                Phone <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">optional</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+359 88 123 4567"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                Email <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">optional</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@email.com"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
              Notes <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">optional</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. prefers morning drop-offs"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        </div>
      </div>

      {/* Vehicles */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 mt-4">
        <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Vehicles</span>
          <button
            type="button"
            onClick={() => setVehicleModal(true)}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            + Add vehicle
          </button>
        </div>
        {vehicles.length === 0 ? (
          <p className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">No vehicles</p>
        ) : (
          <ul>
            {vehicles.map((v, i) => (
              <li key={v.id} className={i < vehicles.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}>
                <Link
                  href={`/vehicles/${v.id}/edit`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {v.licensePlate && (
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 shrink-0">
                        {v.licensePlate}
                      </span>
                    )}
                    {v.description && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                        {v.description}
                      </span>
                    )}
                    {!v.licensePlate && !v.description && (
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">Unknown vehicle</span>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-400 transition-colors">
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
