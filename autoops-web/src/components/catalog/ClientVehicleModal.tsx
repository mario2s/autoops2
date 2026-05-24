'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVehicleAction, assignVehicleToClientAction } from '@/actions/orders';

type Vehicle = { id: string; licensePlate: string | null; description: string | null };

const inputCls =
  'w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-colors';

type Props = {
  clientId: string;
  unknownVehicles: Vehicle[];
  onClose: () => void;
};

export default function ClientVehicleModal({ clientId, unknownVehicles, onClose }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'assign' | 'new'>(unknownVehicles.length > 0 ? 'assign' : 'new');
  const [filter, setFilter] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);

  // New vehicle fields
  const [plate, setPlate] = useState('');
  const [description, setDescription] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filtered = unknownVehicles.filter((v) => {
    const q = filter.toLowerCase();
    return (
      !q ||
      v.licensePlate?.toLowerCase().includes(q) ||
      v.description?.toLowerCase().includes(q)
    );
  });

  async function handleAssign(vehicleId: string) {
    setAssigning(vehicleId);
    const result = await assignVehicleToClientAction(vehicleId, clientId);
    setAssigning(null);
    if ('error' in result) { setError(result.error); return; }
    router.refresh();
    onClose();
  }

  async function handleCreate() {
    if (!plate.trim() && !description.trim()) {
      setError('License plate or description is required');
      return;
    }
    setSaving(true);
    setError('');
    const result = await createVehicleAction({ plate, description, make, model, year, vin, clientId });
    setSaving(false);
    if ('error' in result) { setError(result.error); return; }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Add vehicle</h2>

          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            {unknownVehicles.length > 0 && (
              <button
                type="button"
                onClick={() => setTab('assign')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === 'assign'
                    ? 'border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50'
                    : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                Assign existing
              </button>
            )}
            <button
              type="button"
              onClick={() => setTab('new')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === 'new'
                  ? 'border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50'
                  : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              New vehicle
            </button>
          </div>
        </div>

        {/* Assign tab */}
        {tab === 'assign' && (
          <div className="px-6 py-5 flex flex-col gap-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Vehicles currently assigned to Unknown client.
            </p>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by plate or description…"
              className={inputCls}
            />
            <ul className="max-h-56 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-zinc-400 dark:text-zinc-500">No vehicles found</li>
              ) : (
                filtered.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => handleAssign(v.id)}
                      disabled={assigning === v.id}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {v.licensePlate && (
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 shrink-0">{v.licensePlate}</span>
                        )}
                        {v.description && (
                          <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{v.description}</span>
                        )}
                        {!v.licensePlate && !v.description && (
                          <span className="text-sm text-zinc-400">Unknown vehicle</span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 shrink-0 ml-2">
                        {assigning === v.id ? 'Assigning…' : 'Assign'}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          </div>
        )}

        {/* New vehicle tab */}
        {tab === 'new' && (
          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                  License plate <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">opt.</span>
                </label>
                <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="CB 1234 AB" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                  Description <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">opt.</span>
                </label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Blue SUV" className={inputCls} />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-2 text-center">plate or description required</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                  Make <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">opt.</span>
                </label>
                <input type="text" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                  Model <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">opt.</span>
                </label>
                <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Corolla" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                  Year <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">opt.</span>
                </label>
                <input type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2018" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                VIN <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">optional</span>
              </label>
              <input type="text" value={vin} onChange={(e) => setVin(e.target.value)} placeholder="1HGBH41JXMN109186" className={inputCls} />
            </div>
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          {tab === 'new' && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Adding…' : 'Add vehicle'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
