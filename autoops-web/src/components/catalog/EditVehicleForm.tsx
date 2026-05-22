'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateVehicleAction } from '@/actions/orders';

type ClientSuggestion = { id: string; name: string };

const inputCls =
  'w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-colors';

type Props = {
  id: string;
  unknownClientId: string;
  initialPlate: string;
  initialDescription: string;
  initialMake: string;
  initialModel: string;
  initialYear: string;
  initialVin: string;
  initialClientId: string;
  initialClientName: string;
};

export default function EditVehicleForm({
  id,
  unknownClientId,
  initialPlate,
  initialDescription,
  initialMake,
  initialModel,
  initialYear,
  initialVin,
  initialClientId,
  initialClientName,
}: Props) {
  const router = useRouter();
  const [plate, setPlate] = useState(initialPlate);
  const [description, setDescription] = useState(initialDescription);
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);
  const [year, setYear] = useState(initialYear);
  const [vin, setVin] = useState(initialVin);
  const [clientQuery, setClientQuery] = useState(initialClientName);
  const [selectedClient, setSelectedClient] = useState<ClientSuggestion | null>(
    { id: initialClientId, name: initialClientName },
  );
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function handleClientChange(val: string) {
    setClientQuery(val);
    setSelectedClient(null);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/order-form?type=clients&q=${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      setSuggestions(data.results ?? []);
      setOpen((data.results ?? []).length > 0);
    }, 300);
  }

  function handleClientSelect(c: ClientSuggestion) {
    setSelectedClient(c);
    setClientQuery(c.name);
    setSuggestions([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleClientSelect(suggestions[activeIdx]); }
    else if (e.key === 'Escape') setOpen(false);
  }

  function resolveClientId() {
    if (selectedClient) return selectedClient.id;
    if (clientQuery.trim().toLowerCase() === 'unknown') return unknownClientId;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plate.trim() && !description.trim()) {
      setError('License plate or description is required');
      return;
    }
    const clientId = resolveClientId();
    if (!clientId) {
      setError('Select an existing client or leave as "Unknown"');
      return;
    }
    setSaving(true);
    setError('');
    const result = await updateVehicleAction(id, { plate, description, make, model, year, vin, clientId });
    setSaving(false);
    if ('error' in result) { setError(result.error); return; }
    router.push('/catalog?tab=vehicles');
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Edit Vehicle
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Update vehicle details
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Vehicle details</span>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                License plate <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">optional</span>
              </label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="CB 1234 AB"
                autoFocus
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                Description <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">optional</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="The red Toyota"
                className={inputCls}
              />
            </div>
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-1">
            Plate or description required
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                Make <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">opt.</span>
              </label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Toyota"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                Model <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">opt.</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Corolla"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                Year <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">opt.</span>
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2018"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
              VIN <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">optional</span>
            </label>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="1HGBH41JXMN109186"
              className={inputCls}
            />
          </div>

          <div ref={containerRef} className="relative">
            <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
              Client
            </label>
            <input
              type="text"
              value={clientQuery}
              onChange={(e) => handleClientChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setOpen(true)}
              autoComplete="off"
              className={inputCls}
            />
            {open && suggestions.length > 0 && (
              <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((c, i) => (
                  <li
                    key={c.id}
                    onPointerDown={(e) => { e.preventDefault(); handleClientSelect(c); }}
                    className={`px-3.5 py-2 text-sm cursor-pointer ${
                      i === activeIdx
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
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
