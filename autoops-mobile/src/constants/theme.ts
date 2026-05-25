/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1c1917',
    textSecondary: '#57534e',
    textMuted: '#9e9690',
    background: '#f5f0e8',
    backgroundElement: '#ede8e0',
    backgroundSelected: '#e0d9d2',
    border: 'rgba(28,25,23,0.08)',
    borderStrong: 'rgba(28,25,23,0.15)',
    accent: '#1c1917',
    accentText: '#f5f0e8',
    danger: '#DC2626',
    overdue: '#DC2626',
  },
  dark: {
    text: '#f0ebe5',
    textSecondary: 'rgba(240,235,229,0.55)',
    textMuted: 'rgba(240,235,229,0.35)',
    background: '#171714',
    backgroundElement: '#1e1d1a',
    backgroundSelected: '#292523',
    border: 'rgba(240,235,229,0.08)',
    borderStrong: 'rgba(240,235,229,0.15)',
    accent: '#f0ebe5',
    accentText: '#171714',
    danger: '#f09595',
    overdue: '#f09595',
  },
} as const;

export const StatusPalette = {
  booked: { bg: 'rgba(55,138,221,0.15)', fg: '#85b7eb' },
  in_progress: { bg: 'rgba(29,158,117,0.15)', fg: '#5dcaa5' },
  awaiting: { bg: 'rgba(186,117,23,0.15)', fg: '#fac775' },
  payment: { bg: 'rgba(147,65,221,0.15)', fg: '#c49af5' },
  done: { bg: 'rgba(240,235,229,0.08)', fg: 'rgba(240,235,229,0.65)' },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
