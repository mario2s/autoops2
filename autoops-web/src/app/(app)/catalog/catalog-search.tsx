'use client';

import { useRouter } from 'next/navigation';

type Props = { tab: string; defaultValue: string };

export default function CatalogSearch({ tab, defaultValue }: Props) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('q') as string).trim();
    const sp = new URLSearchParams({ tab });
    if (q) sp.set('q', q);
    router.push(`/catalog?${sp}`);
  }

  const placeholder =
    tab === 'parts' ? 'Search parts…' : tab === 'clients' ? 'Search clients…' : 'Search vehicles…';

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-colors"
      />
      <button
        type="submit"
        className="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
