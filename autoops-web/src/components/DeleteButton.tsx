'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  action: () => Promise<{ error?: string }>;
  label?: string;
};

export default function DeleteButton({ action, label = 'item' }: Props) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'confirming' | 'deleting'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleConfirm(e: React.MouseEvent) {
    stop(e);
    setState('deleting');
    setErrorMsg('');
    const result = await action();
    if (result?.error) {
      setErrorMsg(result.error);
      setState('confirming');
      return;
    }
    router.refresh();
  }

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button
        onClick={(e) => { stop(e); setState(state === 'confirming' ? 'idle' : 'confirming'); setErrorMsg(''); }}
        aria-label={`Delete ${label}`}
        className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
          state === 'confirming'
            ? 'text-red-500 bg-red-50 dark:bg-red-950/40'
            : 'text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M2.5 4h9M5.5 4V2.5h3V4M6 6.5v4M8 6.5v4M3.5 4l.7 7.5h5.6L10.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {state !== 'idle' && (
        <div
          onClick={stop}
          className="absolute right-full mr-1.5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg px-2.5 py-1.5 whitespace-nowrap"
        >
          {errorMsg ? (
            <>
              <span className="text-xs text-red-500">{errorMsg}</span>
              <button onClick={(e) => { stop(e); setState('idle'); setErrorMsg(''); }} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 ml-1">✕</button>
            </>
          ) : (
            <>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Delete?</span>
              <button
                onClick={handleConfirm}
                disabled={state === 'deleting'}
                className="text-xs font-medium text-red-500 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 px-1"
              >
                {state === 'deleting' ? '…' : 'Yes'}
              </button>
              <button onClick={(e) => { stop(e); setState('idle'); }} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                No
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
