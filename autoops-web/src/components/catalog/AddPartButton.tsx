'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PartModal from './PartModal';

export default function AddPartButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
      >
        <span aria-hidden="true">+</span> Add part
      </button>
      {open && (
        <PartModal
          mode="create"
          onSuccess={() => { setOpen(false); router.refresh(); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
