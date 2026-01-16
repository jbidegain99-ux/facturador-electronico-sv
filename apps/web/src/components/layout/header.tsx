'use client';

import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Bell, User } from 'lucide-react';

export function Header() {
  const { tenant, user, theme, setTheme } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-6">
      {/* Company Name */}
      <div>
        <h1 className="text-lg font-semibold">
          {tenant?.nombre || 'Mi Empresa S.A. de C.V.'}
        </h1>
        <p className="text-xs text-muted-foreground">
          NIT: {tenant?.nit || '0000-000000-000-0'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* User Menu */}
        <Button variant="ghost" className="gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden md:inline-block">
            {user?.name || 'Usuario'}
          </span>
        </Button>
      </div>
    </header>
  );
}
