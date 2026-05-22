'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateClientAction } from '@/actions/orders';

const inputCls =
  'w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-colors';

type Props = {
  id: string;
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  initialNotes: string;
};

export default function EditClientForm({ id, initialName, initialPhone, initialEmail, initialNotes }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
