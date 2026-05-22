'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Props = { tab: string; defaultValue: string };

export default function CatalogSearch({ tab, defaultValue }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placeholder =
    tab === 'parts' ? 'Search parts…' : tab === 'clients' ? 'Search clients…' : 'Search vehicles…';

  function navigate(q: string) {
    const sp = new URLSearchParams({ tab });
    if (q.trim()) sp.set('q', q.trim());
    router.push(`/catalog?${sp}`);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    setActiveIdx(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!v.trim()) {
      setSuggestions([]);
      setOpen(false);
      debounceRef.current = setTimeout(() => navigate(''), 300);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/suggestions?tab=${tab}&q=${encodeURIComponent(v.trim())}`);
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setOpen((data.suggestions ?? []).length > 0);
      navigate(v);
    }, 300);
  }

  function handleSelect(s: string) {
    setValue(s);
    setSuggestions([]);
    setOpen(false);
    navigate(s);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuggestions([]);
    setOpen(false);
    navigate(value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // Reset when tab changes (not on every defaultValue change — that would close the dropdown)
  useEffect(() => {
    setValue(defaultValue);
    setSuggestions([]);
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div ref={containerRef} className="relative flex gap-2 max-w-sm">
      <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
        <div className="relative flex-1">
          <input
            name="q"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-colors"
          />
          {open && suggestions.length > 0 && (
            <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleSelect(s);
                  }}
                  className={`px-3.5 py-2 text-sm cursor-pointer truncate ${
                    i === activeIdx
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Search
        </button>
      </form>
    </div>
  );
}
