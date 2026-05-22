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
      <div className="rounded-xl border border-zinc-300 dark:border-zinc-700 overflow-hidden">
        <div
          className={`hidden sm:grid gap-3 px-5 py-3 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-700 ${
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
              className={`grid grid-cols-1 gap-1 sm:gap-3 sm:items-center px-5 py-4 border-b border-zinc-200 dark:border-zinc-700/60 last:border-0 transition-colors ${
                isAdmin
                  ? 'sm:grid-cols-[1fr_180px_150px_40px] hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer'
                  : 'sm:grid-cols-[1fr_180px_150px]'
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
