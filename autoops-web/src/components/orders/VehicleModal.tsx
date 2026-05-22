'use client';

import { useEffect, useRef, useState } from 'react';
import { createVehicleAction, type VehicleData } from '@/actions/orders';

type ClientSuggestion = { id: string; name: string };

type Props = {
  vehicleInput: string;
  clientInput: string;
  unknownClientId: string;
  onCreated: (vehicleId: string, clientId: string) => void;
  onNeedNewClient: (vehicleData: Omit<VehicleData, 'clientId'>, clientQuery: string) => void;
  onClose: () => void;
};

export default function VehicleModal({
  vehicleInput,
  clientInput,
  unknownClientId,
  onCreated,
  onNeedNewClient,
  onClose,
}: Props) {
  const [plate, setPlate] = useState('');
  const [description, setDescription] = useState(vehicleInput);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [clientQuery, setClientQuery] = useState(clientInput || 'Unknown');
  const [selectedClient, setSelectedClient] = useState<ClientSuggestion | null>(null);
  const [clientSuggestions, setClientSuggestions] = useState<ClientSuggestion[]>([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientActiveIdx, setClientActiveIdx] = useState(-1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const clientContainerRef = useRef<HTMLDivElement>(null);
  const clientDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (clientContainerRef.current && !clientContainerRef.current.contains(e.target as Node)) {
        setClientOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function handleClientChange(val: string) {
    setClientQuery(val);
    setSelectedClient(null);
    setClientActiveIdx(-1);
    if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current);
    if (!val.trim()) {
      setClientSuggestions([]);
      setClientOpen(false);
      return;
    }
    clientDebounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/order-form?type=clients&q=${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      setClientSuggestions(data.results ?? []);
      setClientOpen((data.results ?? []).length > 0);
    }, 300);
  }

  function handleClientSelect(c: ClientSuggestion) {
    setSelectedClient(c);
    setClientQuery(c.name);
    setClientSuggestions([]);
    setClientOpen(false);
  }

  function handleClientKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!clientOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setClientActiveIdx((i) => Math.min(i + 1, clientSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setClientActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && clientActiveIdx >= 0) {
      e.preventDefault();
      handleClientSelect(clientSuggestions[clientActiveIdx]);
    } else if (e.key === 'Escape') {
      setClientOpen(false);
    }
  }

  function resolveClientId(): string | null {
    if (selectedClient) return selectedClient.id;
    if (clientQuery.trim().toLowerCase() === 'unknown') return unknownClientId;
    return null;
  }

  async function handleConfirm() {
    if (!plate.trim() && !description.trim()) {
      setError('License plate or description is required');
      return;
    }

    const vehicleData = { plate, description, make, model, year, vin };
    const clientId = resolveClientId();

    if (!clientId) {
      onNeedNewClient(vehicleData, clientQuery.trim());
      return;
    }

    setSaving(true);
    setError('');
    const result = await createVehicleAction({ ...vehicleData, clientId });
    setSaving(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    onCreated(result.id, clientId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            New vehicle — add it?
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            &ldquo;{vehicleInput}&rdquo; doesn&apos;t match any existing vehicle. Confirm details and add it.
          </p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
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
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
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
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
              />
            </div>
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-1 text-center">
            plate or description required
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
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
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
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
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
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
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
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
            />
          </div>

          <div ref={clientContainerRef} className="relative">
            <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
              Client
            </label>
            <input
              type="text"
              value={clientQuery}
              onChange={(e) => handleClientChange(e.target.value)}
              onKeyDown={handleClientKeyDown}
              onFocus={() => clientSuggestions.length > 0 && setClientOpen(true)}
              autoComplete="off"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
            />
            {clientOpen && clientSuggestions.length > 0 && (
              <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
                {clientSuggestions.map((c, i) => (
                  <li
                    key={c.id}
                    onPointerDown={(e) => { e.preventDefault(); handleClientSelect(c); }}
                    className={`px-3.5 py-2 text-sm cursor-pointer ${
                      i === clientActiveIdx
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

          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>

        <p className="px-6 pb-4 text-xs text-zinc-400 dark:text-zinc-500">
          Client defaults to Unknown. Search to assign an existing client, or leave as is.
        </p>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Adding…' : 'Add vehicle & continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
