'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@/lib/session';
import type { OrderForEdit } from '@/db/queries';
import type { VehicleData } from '@/actions/orders';
import { computeOrderTotals } from '@/lib/order-totals';
import {
  createOrderAction,
  updateOrderAction,
  addCatalogPartAction,
} from '@/actions/orders';
import VehicleModal from './VehicleModal';
import ClientModal from './ClientModal';
import PartModal from '../catalog/PartModal';

// ─── Types ───────────────────────────────────────────────────────────────────

type VehicleSuggestion = {
  id: string;
  plate: string | null;
  description: string | null;
  clientId: string;
  clientName: string;
};

type ClientSuggestion = { id: string; name: string };
type PartSuggestion = { id: string; name: string };

type PartRow = {
  key: string;
  catalogPartId: string | null;
  name: string;
  qty: string;
  unitPrice: string;
};

type ServiceRow = {
  key: string;
  description: string;
  costType: 'hourly' | 'fixed';
  hours: string;
  rate: string;
  fixedAmount: string;
};

type Modal =
  | null
  | { type: 'part'; partKey: string }
  | { type: 'vehicle' }
  | { type: 'client'; pendingVehicle: Omit<VehicleData, 'clientId'> | null };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function fmt(n: number) {
  return isNaN(n) ? '—' : `€${n.toFixed(2)}`;
}

function partTotal(row: PartRow) {
  const q = parseFloat(row.qty);
  const p = parseFloat(row.unitPrice);
  return isNaN(q) || isNaN(p) ? 0 : q * p;
}

function serviceTotal(row: ServiceRow) {
  if (row.costType === 'fixed') {
    const v = parseFloat(row.fixedAmount);
    return isNaN(v) ? 0 : v;
  }
  const h = parseFloat(row.hours);
  const r = parseFloat(row.rate);
  return isNaN(h) || isNaN(r) ? 0 : h * r;
}

const inputCls =
  'w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const smallInputCls =
  'w-full px-2.5 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

// smallInputCls without w-full — used for card-bottom inputs that need explicit widths
const compactInputCls =
  'px-2.5 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

// ─── SearchField ──────────────────────────────────────────────────────────────

type SearchFieldProps<T> = {
  value: string;
  onChange: (val: string) => void;
  onSelect: (item: T) => void;
  suggestions: T[];
  open: boolean;
  activeIdx: number;
  itemKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  extra?: React.ReactNode;
};

function SearchField<T>({
  value,
  onChange,
  onSelect,
  suggestions,
  open,
  activeIdx,
  itemKey,
  renderItem,
  placeholder,
  disabled,
  onKeyDown,
  onFocus,
  containerRef,
  extra,
}: SearchFieldProps<T>) {
  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={inputCls}
      />
      {(open && suggestions.length > 0) || extra ? (
        <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((item, i) => (
            <li
              key={itemKey(item)}
              onPointerDown={(e) => { e.preventDefault(); onSelect(item); }}
              className={`px-3.5 py-2 text-sm cursor-pointer ${
                i === activeIdx
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              {renderItem(item)}
            </li>
          ))}
          {extra}
        </ul>
      ) : null}
    </div>
  );
}

// ─── useSearch hook ───────────────────────────────────────────────────────────

function useSearch<T>(fetchUrl: (q: string) => string) {
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function search(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(fetchUrl(q.trim()));
      const data = await res.json();
      const results: T[] = data.results ?? [];
      setSuggestions(results);
      setOpen(results.length > 0);
    }, 300);
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    onEnter: (item: T) => void,
  ) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); onEnter(suggestions[activeIdx]); }
    else if (e.key === 'Escape') setOpen(false);
  }

  function close() { setSuggestions([]); setOpen(false); setActiveIdx(-1); }

  return { suggestions, open, activeIdx, setOpen, search, handleKeyDown, close, containerRef };
}

// ─── Props ────────────────────────────────────────────────────────────────────

type MechanicOption = { id: string; name: string };

type Props = {
  mode: 'create' | 'edit';
  session: SessionUser;
  hourlyRate: number;
  unknownClientId: string;
  mechanics: MechanicOption[];
  initialData?: OrderForEdit;
  orderId?: string;
};

// ─── OrderForm ────────────────────────────────────────────────────────────────

export default function OrderForm({
  mode,
  session,
  hourlyRate,
  unknownClientId,
  mechanics,
  initialData,
  orderId,
}: Props) {
  const router = useRouter();
  const isAdmin = session.role === 'admin';
  const vehicleClientLocked = mode === 'edit' && !isAdmin;
  const deadlineLocked = mode === 'edit' && !isAdmin;

  // ── Vehicle state
  const [vehicleQuery, setVehicleQuery] = useState(initialData?.vehicleDisplay ?? '');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSuggestion | null>(
    initialData
      ? {
          id: initialData.vehicleId,
          plate: initialData.vehiclePlate,
          description: initialData.vehicleDescription,
          clientId: initialData.clientId,
          clientName: initialData.clientName,
        }
      : null,
  );
  const vehicleSearch = useSearch<VehicleSuggestion>(
    (q) =>
      `/api/order-form?type=vehicles&q=${encodeURIComponent(q)}${selectedClient ? `&clientId=${selectedClient.id}` : ''}`,
  );

  // ── Client state
  const [clientQuery, setClientQuery] = useState(initialData?.clientName ?? 'Unknown');
  const [selectedClient, setSelectedClient] = useState<ClientSuggestion | null>(
    initialData ? { id: initialData.clientId, name: initialData.clientName } : null,
  );
  const clientSearch = useSearch<ClientSuggestion>(
    (q) => `/api/order-form?type=clients&q=${encodeURIComponent(q)}`,
  );

  // ── Mechanic state
  const [selectedMechanicId, setSelectedMechanicId] = useState(
    initialData?.mechanicId ?? session.userId,
  );

  // ── Deadline state
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = initialData ? initialData.deadline : (() => { const n = new Date(); n.setDate(n.getDate() + 1); n.setHours(n.getHours() + 1); return n; })();
    return d.toISOString().slice(0, 10);
  });
  const [deadlineTime, setDeadlineTime] = useState(() => {
    const d = initialData ? initialData.deadline : (() => { const n = new Date(); n.setDate(n.getDate() + 1); n.setHours(n.getHours() + 1); return n; })();
    return d.toISOString().slice(11, 16);
  });
  const pastDeadline =
    deadlineDate &&
    deadlineTime &&
    new Date(`${deadlineDate}T${deadlineTime}`) < new Date();

  // ── Parts state
  const [parts, setParts] = useState<PartRow[]>(() =>
    initialData?.parts.map((p) => ({
      key: uid(),
      catalogPartId: p.catalogPartId,
      name: p.name,
      qty: String(p.qty),
      unitPrice: String(p.unitPrice),
    })) ?? [],
  );

  // ── Services state
  const [services, setServices] = useState<ServiceRow[]>(() =>
    initialData?.services.map((s) => ({
      key: uid(),
      description: s.description,
      costType: s.costType,
      hours: s.hours != null ? String(s.hours) : '',
      rate: s.rate != null ? String(s.rate) : String(hourlyRate),
      fixedAmount: s.fixedAmount != null ? String(s.fixedAmount) : '',
    })) ?? [],
  );

  // ── Submit state
  const [modal, setModal] = useState<Modal>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successToast, setSuccessToast] = useState(false);

  // ── Totals
  const totals = computeOrderTotals(
    parts.map((p) => ({ qty: parseFloat(p.qty) || 0, unitPrice: parseFloat(p.unitPrice) || 0 })),
    services.map((s) =>
      s.costType === 'hourly'
        ? { costType: 'hourly' as const, hours: parseFloat(s.hours) || 0, rate: parseFloat(s.rate) || 0 }
        : { costType: 'fixed' as const, fixedAmount: parseFloat(s.fixedAmount) || 0 },
    ),
  );
  const partsSubtotal = totals.parts;
  const servicesSubtotal = totals.services;
  const grandTotal = totals.grand;

  // ── Vehicle handlers
  function handleVehicleChange(val: string) {
    setVehicleQuery(val);
    setSelectedVehicle(null);
    vehicleSearch.search(val);
  }

  function handleVehicleSelect(v: VehicleSuggestion) {
    setSelectedVehicle(v);
    setVehicleQuery(v.plate ?? v.description ?? '');
    vehicleSearch.close();
    setClientQuery(v.clientName);
    setSelectedClient({ id: v.clientId, name: v.clientName });
    clientSearch.close();
  }

  // ── Client handlers
  function handleClientChange(val: string) {
    setClientQuery(val);
    setSelectedClient(null);
    clientSearch.search(val);
  }

  function handleClientSelect(c: ClientSuggestion) {
    setSelectedClient(c);
    setClientQuery(c.name);
    clientSearch.close();
  }

  // ── Parts handlers
  function addPart() {
    setParts((prev) => [...prev, { key: uid(), catalogPartId: null, name: '', qty: '1', unitPrice: '' }]);
  }

  function removePart(key: string) {
    setParts((prev) => prev.filter((r) => r.key !== key));
  }

  function updatePart(key: string, patch: Partial<PartRow>) {
    setParts((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  // ── Service handlers
  function addService() {
    setParts; // just touch to avoid lint warning
    setServices((prev) => [
      ...prev,
      { key: uid(), description: '', costType: 'fixed', hours: '', rate: String(hourlyRate), fixedAmount: '' },
    ]);
  }

  function removeService(key: string) {
    setServices((prev) => prev.filter((r) => r.key !== key));
  }

  function updateService(key: string, patch: Partial<ServiceRow>) {
    setServices((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  // ── Validation
  function validate(currentParts: PartRow[] = parts) {
    const errs: string[] = [];
    if (!vehicleQuery.trim()) errs.push('Vehicle is required');
    if (!deadlineDate || !deadlineTime) errs.push('Deadline is required');
    if (currentParts.length === 0 && services.length === 0) errs.push('Add at least one part or service');
    for (const p of currentParts) {
      if (!p.name.trim() || !p.catalogPartId) errs.push('All parts must be selected from catalog');
      if (!p.qty || parseFloat(p.qty) <= 0) errs.push('Part quantities must be greater than 0');
      if (!p.unitPrice || parseFloat(p.unitPrice) < 0) errs.push('Part prices must be valid');
    }
    for (const s of services) {
      if (!s.description.trim()) errs.push('All services need a description');
      if (s.costType === 'hourly' && (!s.hours || parseFloat(s.hours) <= 0))
        errs.push('Hourly services need valid hours');
    }
    return errs;
  }

  // ── Resolve client ID
  function resolveClientId(): string | null {
    if (selectedClient) return selectedClient.id;
    if (clientQuery.trim().toLowerCase() === 'unknown') return unknownClientId;
    return null;
  }

  // ── Submit helpers
  async function submitOrder(
    vehicleId: string,
    clientId: string,
    currentParts: PartRow[] = parts,
  ) {
    setSubmitting(true);
    const deadline = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();
    const payload = {
      vehicleId,
      clientId,
      deadline,
      mechanicId: selectedMechanicId,
      parts: currentParts.map((p) => ({
        catalogPartId: p.catalogPartId!,
        qty: parseFloat(p.qty),
        unitPrice: parseFloat(p.unitPrice),
      })),
      services: services.map((s) => ({
        description: s.description,
        costType: s.costType,
        hours: s.costType === 'hourly' ? parseFloat(s.hours) : null,
        rate: s.costType === 'hourly' ? parseFloat(s.rate) : null,
        fixedAmount: s.costType === 'fixed' ? parseFloat(s.fixedAmount) : null,
      })),
    };

    if (mode === 'create') {
      const result = await createOrderAction(payload);
      setSubmitting(false);
      if ('error' in result) { setErrors([result.error]); return; }
      router.push(`/dashboard`);
    } else {
      const result = await updateOrderAction(orderId!, payload);
      setSubmitting(false);
      if ('error' in result) { setErrors([result.error]); return; }
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    }
  }

  // ── Main submit handler
  async function handleSubmit(currentParts: PartRow[] = parts) {
    const unresolvedPart = currentParts.find((p) => p.name.trim() !== '' && !p.catalogPartId);
    if (unresolvedPart) {
      setModal({ type: 'part', partKey: unresolvedPart.key });
      return;
    }
    const errs = validate(currentParts);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    const vehicleId = selectedVehicle?.id ?? null;
    const clientId = resolveClientId();

    if (!vehicleId) {
      setModal({ type: 'vehicle' });
      return;
    }

    if (!clientId) {
      setModal({ type: 'client', pendingVehicle: null });
      return;
    }

    await submitOrder(vehicleId, clientId, currentParts);
  }

  // ── Vehicle modal callbacks
  async function onVehicleCreated(vehicleId: string, clientId: string) {
    setModal(null);
    await submitOrder(vehicleId, clientId);
  }

  function onNeedNewClient(
    vehicleData: Omit<VehicleData, 'clientId'>,
    pendingClientQuery: string,
  ) {
    setClientQuery(pendingClientQuery);
    setModal({ type: 'client', pendingVehicle: vehicleData });
  }

  // ── Client modal callbacks
  async function onClientCreated(clientId: string, clientName: string) {
    setSelectedClient({ id: clientId, name: clientName });
    setClientQuery(clientName);
    setModal(null);

    const pendingVehicle = modal && modal.type === 'client' ? modal.pendingVehicle : null;

    if (pendingVehicle) {
      const { createVehicleAction } = await import('@/actions/orders');
      const vResult = await createVehicleAction({ ...pendingVehicle, clientId });
      if ('error' in vResult) { setErrors([vResult.error]); return; }
      await submitOrder(vResult.id, clientId);
    } else {
      const vehicleId = selectedVehicle?.id;
      if (!vehicleId) { setErrors(['Vehicle is required']); return; }
      await submitOrder(vehicleId, clientId);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-6 sm:mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {mode === 'create' ? 'New Order' : 'Edit Order'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {mode === 'create' ? 'Create a repair order' : 'Update repair order'}
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:min-w-[200px]">
            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
              Mechanic
            </label>
            {isAdmin ? (
              <select
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                className={inputCls}
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            ) : (
              <div className="px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {mechanics.find((m) => m.id === selectedMechanicId)?.name ?? '—'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* ── Section 1: Vehicle & Client ── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Vehicle & Client</span>
            </div>
            <div className="px-5 py-4 space-y-4">
              {vehicleClientLocked ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                      Vehicle
                    </label>
                    <div className="px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {vehicleQuery || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                      Client
                    </label>
                    <div className="px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {clientQuery || '—'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                      Vehicle — plate or description
                    </label>
                    <SearchField<VehicleSuggestion>
                      value={vehicleQuery}
                      onChange={handleVehicleChange}
                      onSelect={handleVehicleSelect}
                      suggestions={vehicleSearch.suggestions}
                      open={vehicleSearch.open}
                      activeIdx={vehicleSearch.activeIdx}
                      itemKey={(v) => v.id}
                      renderItem={(v) => (
                        <div>
                          <span className="font-medium">{v.plate ?? v.description}</span>
                          {v.plate && v.description && (
                            <span className="text-zinc-400 ml-1.5 text-xs">{v.description}</span>
                          )}
                          <span className="block text-xs text-zinc-400 mt-0.5">{v.clientName}</span>
                        </div>
                      )}
                      placeholder="Search by plate or description…"
                      onKeyDown={(e) => vehicleSearch.handleKeyDown(e, handleVehicleSelect)}
                      onFocus={() => vehicleSearch.suggestions.length > 0 && vehicleSearch.setOpen(true)}
                      containerRef={vehicleSearch.containerRef}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                      Client
                    </label>
                    <SearchField<ClientSuggestion>
                      value={clientQuery}
                      onChange={handleClientChange}
                      onSelect={handleClientSelect}
                      suggestions={clientSearch.suggestions}
                      open={clientSearch.open}
                      activeIdx={clientSearch.activeIdx}
                      itemKey={(c) => c.id}
                      renderItem={(c) => c.name}
                      placeholder="Search client…"
                      onKeyDown={(e) => clientSearch.handleKeyDown(e, handleClientSelect)}
                      onFocus={() => clientSearch.suggestions.length > 0 && clientSearch.setOpen(true)}
                      containerRef={clientSearch.containerRef}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ── Section 2: Deadline ── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Deadline</span>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    disabled={deadlineLocked}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    disabled={deadlineLocked}
                    className={inputCls}
                  />
                </div>
              </div>
              {pastDeadline && (
                <p className="mt-2 text-xs text-amber-500 dark:text-amber-400">
                  ⚠ Selected deadline is in the past
                </p>
              )}
            </div>
          </section>

          {/* ── Section 3: Parts ── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Parts</span>
              <button
                type="button"
                onClick={addPart}
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                + Add part
              </button>
            </div>

            {parts.length > 0 && (
              <div className="px-3 sm:px-5 pt-4 pb-2">
                {/* Column headers: desktop only */}
                <div className="hidden sm:grid grid-cols-[1fr_64px_96px_72px_28px] gap-2 mb-2">
                  {['Part name', 'Qty', 'Unit price', 'Total', ''].map((h) => (
                    <span key={h} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                      {h}
                    </span>
                  ))}
                </div>
                <div className="space-y-3 sm:space-y-2">
                  {parts.map((row) => (
                    <PartRowInput
                      key={row.key}
                      row={row}
                      onChange={(patch) => updatePart(row.key, patch)}
                      onRemove={() => removePart(row.key)}
                      userId={session.userId}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-4">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Parts subtotal</span>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 min-w-[72px] text-right">
                {fmt(partsSubtotal)}
              </span>
            </div>
          </section>

          {/* ── Section 4: Services ── */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Services & Labor</span>
              <button
                type="button"
                onClick={addService}
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                + Add service
              </button>
            </div>

            {services.length > 0 && (
              <div className="px-3 sm:px-5 pt-4 pb-2">
                {/* Column headers: desktop only */}
                <div className="hidden sm:grid grid-cols-[1fr_104px_64px_80px_80px_28px] gap-2 mb-2">
                  {['Description', 'Type', 'Hours', 'Rate €/h', 'Total', ''].map((h) => (
                    <span key={h} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                      {h}
                    </span>
                  ))}
                </div>
                <div className="space-y-3 sm:space-y-2">
                  {services.map((row) => (
                    <ServiceRowInput
                      key={row.key}
                      row={row}
                      onChange={(patch) => updateService(row.key, patch)}
                      onRemove={() => removeService(row.key)}
                      rateReadOnly
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-4">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Services subtotal</span>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 min-w-[72px] text-right">
                {fmt(servicesSubtotal)}
              </span>
            </div>
          </section>

          {/* ── Grand total ── */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
              <span>Parts</span><span>{fmt(partsSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
              <span>Services</span><span>{fmt(servicesSubtotal)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Grand total</span>
              <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* ── Errors ── */}
          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 space-y-1">
              {errors.map((e) => (
                <p key={e} className="text-sm text-red-600 dark:text-red-400">{e}</p>
              ))}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {submitting
                ? 'Saving…'
                : mode === 'create'
                ? 'Create Order'
                : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Success toast (edit mode) ── */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium shadow-lg">
          Order updated
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.type === 'part' && (
        <PartModal
          mode="create"
          initialName={parts.find((p) => p.key === modal.partKey)?.name ?? ''}
          onSuccess={(id, name) => {
            const partKey = modal.partKey;
            const updatedParts = parts.map((r) =>
              r.key === partKey ? { ...r, catalogPartId: id, name } : r,
            );
            setParts(updatedParts);
            setModal(null);
            handleSubmit(updatedParts);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'vehicle' && (
        <VehicleModal
          vehicleInput={vehicleQuery}
          clientInput={clientQuery}
          unknownClientId={unknownClientId}
          onCreated={onVehicleCreated}
          onNeedNewClient={onNeedNewClient}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'client' && (
        <ClientModal
          clientInput={clientQuery}
          onCreated={onClientCreated}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ─── PartRowInput ─────────────────────────────────────────────────────────────

type PartRowInputProps = {
  row: PartRow;
  onChange: (patch: Partial<PartRow>) => void;
  onRemove: () => void;
  userId: string;
};

function PartRowInput({ row, onChange, onRemove }: PartRowInputProps) {
  const [suggestions, setSuggestions] = useState<PartSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [adding, setAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  function handleNameChange(val: string) {
    onChange({ name: val, catalogPartId: null });
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/order-form?type=parts&q=${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      setSuggestions(data.results ?? []);
      setOpen(true);
    }, 300);
  }

  function selectPart(p: PartSuggestion) {
    onChange({ name: p.name, catalogPartId: p.id });
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
  }

  async function addToCatalog() {
    if (!row.name.trim()) return;
    setAdding(true);
    setOpen(false);
    const result = await addCatalogPartAction(row.name.trim());
    setAdding(false);
    if ('error' in result) return;
    onChange({ name: result.name, catalogPartId: result.id });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const allItems = [...suggestions, ...(row.name.trim() && !row.catalogPartId ? ['__add__'] : [])];
    if (!open || allItems.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      if (activeIdx < suggestions.length) selectPart(suggestions[activeIdx]);
      else addToCatalog();
    } else if (e.key === 'Escape') setOpen(false);
  }

  const showAddOption = open && row.name.trim() && !row.catalogPartId;
  const total = partTotal(row);

  return (
    // Mobile: card with top/bottom strips. Desktop (sm+): 5-column grid row.
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden sm:border-0 sm:rounded-none sm:overflow-visible sm:grid sm:grid-cols-[1fr_64px_96px_72px_28px] sm:gap-2 sm:items-start">

      {/* Card top strip (mobile) / name cell (desktop) */}
      <div className="flex items-start gap-1.5 px-2.5 py-2 sm:p-0 sm:contents">
        <div ref={containerRef} className="relative flex-1 sm:flex-none">
          <input
            type="text"
            value={row.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => (suggestions.length > 0 || showAddOption) && setOpen(true)}
            placeholder="Search or add part…"
            autoComplete="off"
            className={smallInputCls}
          />
          {open && (suggestions.length > 0 || showAddOption) && (
            <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <li
                  key={s.id}
                  onPointerDown={(e) => { e.preventDefault(); selectPart(s); }}
                  className={`px-3 py-2 text-sm cursor-pointer truncate ${
                    i === activeIdx
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {s.name}
                </li>
              ))}
              {showAddOption && (
                <li
                  onPointerDown={(e) => { e.preventDefault(); addToCatalog(); }}
                  className={`px-3 py-2 text-sm cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                    activeIdx === suggestions.length ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                  }`}
                >
                  {adding ? 'Adding…' : `Add "${row.name}" to catalog`}
                </li>
              )}
            </ul>
          )}
        </div>
        {/* Remove: top-right corner of card on mobile, hidden on desktop */}
        <button
          type="button"
          onClick={onRemove}
          className="sm:hidden mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          aria-label="Remove part"
        >
          ×
        </button>
      </div>

      {/* Divider between card top and bottom strips — mobile only */}
      <div className="sm:hidden h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Card bottom strip (mobile) / numeric cells (desktop) */}
      <div className="flex items-center gap-2 px-2.5 py-2 sm:p-0 sm:contents">
        <input
          type="number"
          value={row.qty}
          onChange={(e) => onChange({ qty: e.target.value })}
          min="0.01"
          step="0.01"
          placeholder="1"
          className={`${compactInputCls} w-11 sm:w-full shrink-0`}
        />
        {/* × separator: mobile only (display:none at sm+ so no grid cell consumed) */}
        <span className="sm:hidden text-xs text-zinc-400 dark:text-zinc-600 shrink-0">×</span>
        <input
          type="number"
          value={row.unitPrice}
          onChange={(e) => onChange({ unitPrice: e.target.value })}
          min="0"
          step="0.01"
          placeholder="0.00"
          className={`${compactInputCls} flex-1 sm:flex-none sm:w-full`}
        />
        <span className="ml-auto sm:ml-0 sm:py-1.5 sm:text-right sm:min-w-[72px] text-sm font-medium text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
          {total > 0 ? fmt(total) : '—'}
        </span>
        {/* Remove: desktop only */}
        <button
          type="button"
          onClick={onRemove}
          className="hidden sm:flex mt-0.5 w-6 h-6 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          aria-label="Remove part"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── ServiceRowInput ──────────────────────────────────────────────────────────

type ServiceRowInputProps = {
  row: ServiceRow;
  onChange: (patch: Partial<ServiceRow>) => void;
  onRemove: () => void;
  rateReadOnly?: boolean;
};

function ServiceRowInput({ row, onChange, onRemove, rateReadOnly }: ServiceRowInputProps) {
  const hourly = row.costType === 'hourly';
  const total = serviceTotal(row);

  return (
    // Mobile: card with top/bottom strips. Desktop (sm+): 6-column grid row.
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden sm:border-0 sm:rounded-none sm:overflow-visible sm:grid sm:grid-cols-[1fr_104px_64px_80px_80px_28px] sm:gap-2 sm:items-center">

      {/* Card top strip (mobile) / description cell (desktop) */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 sm:p-0 sm:contents">
        <input
          type="text"
          value={row.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Description"
          className={`${smallInputCls} flex-1 sm:flex-none`}
        />
        {/* Remove: top-right corner of card on mobile, hidden on desktop */}
        <button
          type="button"
          onClick={onRemove}
          className="sm:hidden w-6 h-6 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          aria-label="Remove service"
        >
          ×
        </button>
      </div>

      {/* Divider between card top and bottom strips — mobile only */}
      <div className="sm:hidden h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Card bottom strip (mobile) / cells 2–6 (desktop via sm:contents) */}
      <div className="flex items-center gap-2 px-2.5 py-2 sm:p-0 sm:contents">

        {/* Type toggle → desktop col 2 */}
        <div className="flex shrink-0">
          <button
            type="button"
            onClick={() => onChange({ costType: 'hourly' })}
            className={`flex-1 px-2 py-2 text-xs rounded-l-md border border-r-0 transition-colors ${
              hourly
                ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium border-zinc-900 dark:border-zinc-50'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            Hourly
          </button>
          <button
            type="button"
            onClick={() => onChange({ costType: 'fixed' })}
            className={`flex-1 px-2 py-2 text-xs rounded-r-md border transition-colors ${
              !hourly
                ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium border-zinc-900 dark:border-zinc-50'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            Fixed
          </button>
        </div>

        {/* Hours input → desktop col 3; hidden on mobile when fixed */}
        <input
          type="number"
          value={row.hours}
          onChange={(e) => onChange({ hours: e.target.value })}
          min="0"
          step="0.5"
          placeholder="0"
          disabled={!hourly}
          className={`${compactInputCls} w-12 sm:w-full shrink-0 ${!hourly ? 'hidden sm:block' : ''}`}
        />

        {/* Rate label → mobile + hourly only (sm:hidden = no desktop grid cell consumed) */}
        <span className={`text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap shrink-0 sm:hidden${!hourly ? ' hidden' : ''}`}>
          @ €{row.rate}/h
        </span>

        {/* Rate input → desktop only → col 4 */}
        <input
          type="number"
          value={row.rate}
          onChange={(e) => !rateReadOnly && onChange({ rate: e.target.value })}
          min="0"
          step="0.01"
          placeholder="0.00"
          disabled={!hourly}
          readOnly={rateReadOnly}
          className={`${smallInputCls} hidden sm:block ${rateReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        {/* Mobile right side: fixed-amount input (fixed only) + total — sm:hidden = no desktop grid cells */}
        <div className="sm:hidden ml-auto flex items-center gap-1.5 shrink-0">
          {!hourly && (
            <input
              type="number"
              value={row.fixedAmount}
              onChange={(e) => onChange({ fixedAmount: e.target.value })}
              min="0"
              step="0.01"
              placeholder="0.00"
              className={`${compactInputCls} w-16 text-right`}
            />
          )}
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap min-w-[3rem] text-right">
            {total > 0 ? fmt(total) : '—'}
          </span>
        </div>

        {/* Desktop: total (hourly, read-only) or fixed-amount (editable) → col 5 */}
        <input
          type="number"
          value={hourly ? (total > 0 ? total.toFixed(2) : '') : row.fixedAmount}
          onChange={(e) => !hourly && onChange({ fixedAmount: e.target.value })}
          readOnly={hourly}
          min="0"
          step="0.01"
          placeholder="0.00"
          className={`${smallInputCls} hidden sm:block ${hourly ? 'opacity-50 cursor-not-allowed' : 'border-zinc-300 dark:border-zinc-600'}`}
        />

        {/* Remove: desktop only → col 6 */}
        <button
          type="button"
          onClick={onRemove}
          className="hidden sm:flex w-6 h-6 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          aria-label="Remove service"
        >
          ×
        </button>

      </div>
    </div>
  );
}
