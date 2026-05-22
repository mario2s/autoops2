'use client';

import { useTheme } from '@/components/theme-provider';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={!mounted ? 'Toggle theme' : isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-colors"
    >
      {/* Reserve space before mount to prevent layout shift */}
      {!mounted ? (
        <div className="w-4 h-4" />
      ) : isDark ? (
        /* Sun — click to go light */
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          <line x1="8" y1="0.5" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="13.5" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0.5" y1="8" x2="2.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="13.5" y1="8" x2="15.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2.64" y1="2.64" x2="4.05" y2="4.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11.95" y1="11.95" x2="13.36" y2="13.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2.64" y1="13.36" x2="4.05" y2="11.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11.95" y1="4.05" x2="13.36" y2="2.64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        /* Moon — click to go dark */
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M13.5 10a6 6 0 0 1-7.5-7.5A6.5 6.5 0 1 0 13.5 10z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
