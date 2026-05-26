'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PartModal from './PartModal';
import DeleteButton from '@/components/DeleteButton';
import { deleteCatalogPartAction } from '@/actions/delete';

type Part = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
};

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; part: Part }
  | null;

type Props = {
  parts: Part[];
  isAdmin: boolean;
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PartsCatalogTab({ parts, isAdmin }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);

  function handleSuccess() {
    setModal(null);
    router.refresh();
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-zinc-300 dark:border-zinc-700 overflow-hidden">
        <div
          className={`grid gap-3 px-5 py-3 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-700 ${
            isAdmin ? 'grid-cols-[1fr_180px_150px_40px]' : 'grid-cols-[1fr_180px_150px]'
          }`}
        >
          {(['Part name', 'Created by', 'Date added', ...(isAdmin ? [''] : [])] as string[]).map((col, i) => (
            <span key={i} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
              {col}
            </span>
          ))}
        </div>

        {parts.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-400 dark:text-zinc-500">
            No parts found
          </div>
        ) : (
          parts.map((part) => (
            <div
              key={part.id}
              onClick={isAdmin ? () => setModal({ mode: 'edit', part }) : undefined}
              className={`grid gap-3 items-center px-5 py-4 border-b border-zinc-200 dark:border-zinc-700/60 last:border-0 transition-colors ${
                isAdmin
                  ? 'grid-cols-[1fr_180px_150px_40px] hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer'
                  : 'grid-cols-[1fr_180px_150px]'
              }`}
            >
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{part.name}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{part.createdBy}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(part.createdAt)}</div>
              {isAdmin && (
                <div onClick={(e) => e.stopPropagation()}>
                  <DeleteButton action={deleteCatalogPartAction.bind(null, part.id)} label="part" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Mobile cards */}
      {parts.length === 0 ? (
        <div className="sm:hidden rounded-xl border border-zinc-300 dark:border-zinc-700 overflow-hidden">
          <div className="flex items-center justify-center py-16 text-sm text-zinc-400 dark:text-zinc-500">
            No parts found
          </div>
        </div>
      ) : (
        <div className="sm:hidden flex flex-col gap-2">
          {parts.map((part) => (
            <div
              key={part.id}
              onClick={isAdmin ? () => setModal({ mode: 'edit', part }) : undefined}
              className={`rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-50 dark:bg-zinc-900 ${isAdmin ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between px-4 pt-3 pb-2.5">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">{part.name}</div>
                {isAdmin && (
                  <div className="-mt-1 -mr-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <DeleteButton action={deleteCatalogPartAction.bind(null, part.id)} label="part" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700/60 px-4 py-2.5">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{part.createdBy}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatDate(part.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <PartModal
          {...(modal.mode === 'create'
            ? { mode: 'create' as const }
            : { mode: 'edit' as const, part: modal.part })}
          onSuccess={handleSuccess}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
