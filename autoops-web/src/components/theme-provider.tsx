'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(
    NextThemesProvider,
    { attribute: 'class', defaultTheme: 'system', enableSystem: true },
    children
  );
}
