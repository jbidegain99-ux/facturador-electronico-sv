'use client';

import * as React from 'react';
import { Search, BookOpen, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { NuevaCuentaModal } from './nueva-cuenta-modal';
import type { AccountingAccount } from './nueva-cuenta-modal';

interface CuentaSearchProps {
  onSelect: (cuenta: AccountingAccount) => void;
  selected?: string; // cuenta id
  placeholder?: string;
}

export function CuentaSearch({ onSelect, selected, placeholder = 'Buscar cuenta contable...' }: CuentaSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [allAccounts, setAllAccounts] = React.useState<AccountingAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<AccountingAccount | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load postable accounts on mount
  const loadAccounts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<AccountingAccount[]>('/accounting/accounts/postable');
      setAllAccounts(Array.isArray(data) ? data : []);
    } catch {
      setAllAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Resolve selected display when id changes
  React.useEffect(() => {
    if (!selected) {
      setSelectedAccount(null);
      return;
    }
    const found = allAccounts.find((a) => a.id === selected);
    if (found) setSelectedAccount(found);
  }, [selected, allAccounts]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return allAccounts.slice(0, 20);
    const q = search.toLowerCase();
    return allAccounts
      .filter((a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [allAccounts, search]);

  // OPTIONS: first is "create new", then filtered accounts
  type Option =
    | { type: 'action' }
    | { type: 'account'; data: AccountingAccount };

  const options: Option[] = React.useMemo(() => {
    const opts: Option[] = [{ type: 'action' }];
    filtered.forEach((a) => opts.push({ type: 'account', data: a }));
    return opts;
  }, [filtered]);

  const handleSelect = (cuenta: AccountingAccount) => {
    setSelectedAccount(cuenta);
    onSelect(cuenta);
    setSearch('');
    setOpen(false);
    setHighlightedIndex(0);
  };

  const handleCuentaCreated = (cuenta: AccountingAccount) => {
    setAllAccounts((prev) => [...prev, cuenta]);
    handleSelect(cuenta);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter': {
        e.preventDefault();
        const opt = options[highlightedIndex];
        if (opt?.type === 'account') {
          handleSelect(opt.data);
        } else if (opt?.type === 'action') {
          setOpen(false);
          setModalOpen(true);
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const displayValue = selectedAccount
    ? `${selectedAccount.code} — ${selectedAccount.name}`
    : '';

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={open ? search : displayValue}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
                if (!open) setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="pl-9"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border overflow-hidden"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-[260px] overflow-y-auto">
            {options.map((opt, index) => {
              const isHighlighted = index === highlightedIndex;

              if (opt.type === 'action') {
                return (
                  <button
                    key="create-cuenta"
                    className={cn(
                      'w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors',
                      isHighlighted ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-primary'
                    )}
                    onClick={() => {
                      setOpen(false);
                      setModalOpen(true);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-md bg-blue-500/20 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="font-medium">+ Crear cuenta nueva</span>
                  </button>
                );
              }

              const cuenta = opt.data;
              return (
                <button
                  key={cuenta.id}
                  className={cn(
                    'w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors',
                    isHighlighted
                      ? 'bg-primary/20 text-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                  onClick={() => handleSelect(cuenta)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{cuenta.name}</p>
                    <p className="text-xs text-muted-foreground">{cuenta.code}</p>
                  </div>
                </button>
              );
            })}

            {!isLoading && filtered.length === 0 && search.trim() && (
              <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                No se encontraron cuentas para &quot;{search}&quot;
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <NuevaCuentaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={handleCuentaCreated}
      />
    </>
  );
}
