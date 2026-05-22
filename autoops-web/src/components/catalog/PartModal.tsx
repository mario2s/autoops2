'use client';

import { useState } from 'react';
import { createCatalogPartAction, updateCatalogPartAction } from '@/actions/orders';

type Part = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
};

type Props =
  | { mode: 'create'; onSuccess: (id: string, name: string) => void; onClose: () => void }
  | { mode: 'edit'; part: Part; onSuccess: (id: string, name: string) => void; onClose: () => void };

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PartModal(props: Props) {
  const [name, setName] = useState(props.mode === 'edit' ? props.part.name : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Part name is required');
      return;
    }
    setSaving(true);
    setError('');

    if (props.mode === 'create') {
      const result = await createCatalogPartAction(name);
      setSaving(false);
      if ('error' in result) { setError(result.error); return; }
      props.onSuccess(result.id, result.name);
    } else {
      const result = await updateCatalogPartAction(props.part.id, name);
      setSaving(false);
      if ('error' in result) { setError(result.error); return; }
      props.onSuccess(props.part.id, name.trim());
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {props.mode === 'create' ? 'Add part' : 'Edit part'}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {props.mode === 'create'
              ? 'Add a new part to the catalog. It will be immediately available to all users.'
              : 'Renaming this part will update it across all historical orders.'}
          </p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
              Part name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && !saving && handleSubmit()}
              placeholder={props.mode === 'create' ? 'e.g. Brake pads – front' : undefined}
              autoFocus
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
            />
            <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
              {props.mode === 'create'
                ? 'Name must be unique in the catalog. Be specific to avoid duplicates.'
                : 'Changing the name affects all orders that reference this catalog entry.'}
            </p>
          </div>

          {props.mode === 'edit' && (
            <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Added by</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {props.part.createdBy} · {formatDate(props.part.createdAt)}
              </span>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={props.onClose}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {saving
              ? (props.mode === 'create' ? 'Adding…' : 'Saving…')
              : (props.mode === 'create' ? 'Add to catalog' : 'Save changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
