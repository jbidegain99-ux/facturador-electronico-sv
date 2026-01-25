'use client';

import * as React from 'react';
import { useAppStore } from '@/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Remove existing theme classes and apply new one
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme, mounted]);

  // Set initial theme class on mount to prevent flash
  React.useEffect(() => {
    const root = document.documentElement;
    // Default to dark if no theme is set
    if (!root.classList.contains('light') && !root.classList.contains('dark')) {
      root.classList.add('dark');
    }
  }, []);

  return <>{children}</>;
}
