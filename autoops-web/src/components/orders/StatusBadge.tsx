'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateOrderStatusAction } from '@/actions/orders';

type OrderStatus = 'booked' | 'in_progress' | 'awaiting' | 'payment' | 'done';

const STATUS_BADGE: Record<OrderStatus, string> = {
  booked: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  in_progress: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  awaiting: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  payment: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  done: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  booked: 'Booked',
  in_progress: 'In progress',
  awaiting: 'Awaiting',
  payment: 'Payment',
  done: 'Done',
};

const ALL_STATUSES: OrderStatus[] = ['booked', 'in_progress', 'awaiting', 'payment', 'done'];

export default function StatusBadge({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<OrderStatus>(status);
  const [isPending, startTransition] = useTransition();
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      });
    }

    function onClickOutside(e: MouseEvent) {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function handleSelect(s: OrderStatus) {
    if (s === current) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, s);
      if (!('error' in result)) setCurrent(s);
      setOpen(false);
    });
  }

  const dropdown =
    open
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'absolute', top: pos.top, left: pos.left }}
            className="z-[9999] min-w-[140px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl shadow-black/40 py-1 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[s]}`}
                >
                  {STATUS_LABEL[s]}
                </span>
                {s === current && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                    className="ml-auto shrink-0 text-zinc-400"
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
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
        }}
        disabled={isPending}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity cursor-pointer ${STATUS_BADGE[current]} ${isPending ? 'opacity-60' : 'hover:ring-2 hover:ring-offset-1 hover:ring-zinc-300 dark:hover:ring-zinc-600'}`}
      >
        {STATUS_LABEL[current]}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          className="shrink-0 opacity-60"
        >
          <path
            d="M2.5 3.5L5 6.5L7.5 3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {dropdown}
    </>
  );
}
