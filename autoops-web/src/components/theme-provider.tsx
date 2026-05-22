'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: 'light' | 'dark' | undefined;
};

const Ctx = createContext<ThemeCtx>({ theme: 'system', setTheme: () => {}, resolvedTheme: undefined });

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const resolved = resolve(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolved] = useState<'light' | 'dark' | undefined>(undefined);

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme | null) ?? 'system';
    setThemeState(stored);
    setResolved(applyTheme(stored));

    // Track system preference changes when theme === 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function onSystemChange() {
      setThemeState((t) => {
        if (t === 'system') setResolved(applyTheme('system'));
        return t;
      });
    }
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem('theme', t);
    setResolved(applyTheme(t));
  }

  return <Ctx.Provider value={{ theme, setTheme, resolvedTheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
