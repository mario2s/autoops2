'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateOrderMechanicAction } from '@/actions/orders';

type Mechanic = { id: string; name: string };

export default function MechanicBadge({
  orderId,
  mechanicId,
  mechanicName,
  mechanics,
}: {
  orderId: string;
  mechanicId: string;
  mechanicName: string;
  mechanics: Mechanic[];
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<Mechanic | null>(null);
  const [current, setCurrent] = useState({ id: mechanicId, name: mechanicName });
  const [isPending, startTransition] = useTransition();
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open && !confirming) return;

    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      });
    }

    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inButton = buttonRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      const inConfirm = confirmRef.current?.contains(target);
      if (!inButton && !inDropdown && !inConfirm) {
        setOpen(false);
        setConfirming(null);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open, confirming]);

  function handleSelect(m: Mechanic) {
    if (m.id === current.id) {
      setOpen(false);
      return;
    }
    setOpen(false);
    setConfirming(m);
  }

  function handleConfirm() {
    if (!confirming) return;
    const next = confirming;
    setConfirming(null);
    startTransition(async () => {
      const result = await updateOrderMechanicAction(orderId, next.id);
      if (!('error' in result)) setCurrent(next);
    });
  }

  const dropdown =
    open
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'absolute', top: pos.top, left: pos.left }}
            className="z-[9999] min-w-[160px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 shadow-xl shadow-black/40 py-1 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {mechanics.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelect(m)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              >
                <span className="flex-1 truncate">{m.name}</span>
                {m.id === current.id && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0 text-zinc-400">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  const confirmDialog =
    confirming
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={(e) => e.stopPropagation()}>
            <div
              ref={confirmRef}
              className="mx-4 w-full max-w-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-5"
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-1">Change mechanic?</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
                Assign this order to <span className="font-medium text-zinc-700 dark:text-zinc-300">{confirming.name}</span>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
          setConfirming(null);
        }}
        disabled={isPending}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-opacity cursor-pointer ${isPending ? 'opacity-60' : 'hover:ring-2 hover:ring-offset-1 hover:ring-zinc-300 dark:hover:ring-zinc-600'}`}
      >
        <span className="truncate max-w-[130px]">{current.name}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="shrink-0 opacity-60">
          <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {dropdown}
      {confirmDialog}
    </>
  );
}
