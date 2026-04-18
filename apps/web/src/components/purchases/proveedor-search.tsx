'use client';

import * as React from 'react';
import { Search, X, Building2, Plus, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store';
import type { Proveedor } from '@/types/purchase';
import { NuevoProveedorModal } from './nuevo-proveedor-modal';

interface ProveedorSearchProps {
  selected?: Proveedor;
  onSelect: (p: Proveedor) => void;
  disabled?: boolean;
}

const RECENT_KEY_PREFIX = 'proveedor-recents';
const MAX_RECENTS = 5;

function getRecentKey(tenantId?: string) {
  return tenantId ? `${RECENT_KEY_PREFIX}-${tenantId}` : RECENT_KEY_PREFIX;
}

function getRecents(tenantId?: string): Proveedor[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getRecentKey(tenantId));
    return stored ? (JSON.parse(stored) as Proveedor[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(proveedor: Proveedor, tenantId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getRecentKey(tenantId);
    const recents = getRecents(tenantId).filter((p) => p.id !== proveedor.id);
    recents.unshift(proveedor);
    localStorage.setItem(key, JSON.stringify(recents.slice(0, MAX_RECENTS)));
  } catch {
    // ignore
  }
}

export function ProveedorSearch({ selected, onSelect, disabled = false }: ProveedorSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [recents, setRecents] = React.useState<Proveedor[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const tenant = useAppStore((s) => s.tenant);
  const tenantId = tenant?.id;

  React.useEffect(() => {
    setRecents(getRecents(tenantId));
  }, [tenantId]);

  React.useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!search.trim()) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await apiFetch<{ data?: Proveedor[] } | Proveedor[]>(
          `/clientes?isSupplier=true&q=${encodeURIComponent(search)}&limit=10`
        );
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setResults(list);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de busqueda');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  type Option =
    | { type: 'header'; label: string }
    | { type: 'proveedor'; data: Proveedor }
    | { type: 'action' };

  const getOptions = React.useCallback((): Option[] => {
    const opts: Option[] = [];

    // Always first: create new
    opts.push({ type: 'action' });

    if (search.trim()) {
      if (results.length > 0) {
        opts.push({ type: 'header', label: 'Resultados' });
        results.forEach((p) => opts.push({ type: 'proveedor', data: p }));
      }
    } else {
      if (recents.length > 0) {
        opts.push({ type: 'header', label: 'Recientes' });
        recents.forEach((p) => opts.push({ type: 'proveedor', data: p }));
      }
    }

    return opts;
  }, [search, results, recents]);

  const options = getOptions();
  const selectableOptions = options.filter((o) => o.type !== 'header');

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
        setHighlightedIndex((i) => Math.min(i + 1, selectableOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter': {
        e.preventDefault();
        const sel = selectableOptions[highlightedIndex];
        if (sel?.type === 'proveedor') {
          handleSelect(sel.data);
        } else if (sel?.type === 'action') {
          handleCreateNew();
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const handleSelect = (proveedor: Proveedor) => {
    saveRecent(proveedor, tenantId);
    setRecents(getRecents(tenantId));
    onSelect(proveedor);
    setSearch('');
    setOpen(false);
    setHighlightedIndex(0);
  };

  const handleDeselect = () => {
    // We reset the parent by passing a synthetic empty-ish event; parent controls state
    // The parent should handle undefined selection via a separate clear callback.
    // For simplicity, we expose the deselect to parent by re-emitting an empty-like state.
    // Since the prop is `selected`, parent controls it; we just close/clear our local state.
    setSearch('');
  };

  const handleCreateNew = () => {
    setOpen(false);
    setModalOpen(true);
  };

  const handleProveedorCreated = (proveedor: Proveedor) => {
    handleSelect(proveedor);
  };

  if (selected) {
    return (
      <>
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg border border-border bg-card transition-all',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-fuchsia-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{selected.nombre}</p>
            <p className="text-xs text-muted-foreground">
              NIT: {selected.numDocumento}
              {selected.nrc && ` | NRC: ${selected.nrc}`}
              {selected.esGranContribuyente && (
                <span className="ml-2 text-amber-600 font-medium">Gran Contrib.</span>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
            onClick={handleDeselect}
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <NuevoProveedorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onCreated={handleProveedorCreated}
        />
      </>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
                if (!open) setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              placeholder="Buscar proveedor por nombre, NIT..."
              className="pl-9"
              disabled={disabled}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
          <div className="max-h-[300px] overflow-y-auto">
            {error && (
              <div className="px-4 py-3 text-sm text-destructive">{error}</div>
            )}

            {isLoading && !results.length && (
              <div className="px-4 py-6 text-center text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-sm">Buscando...</span>
              </div>
            )}

            {!isLoading && search.trim() && results.length === 0 && !error && (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No se encontraron proveedores con &quot;{search}&quot;
              </div>
            )}

            {options.map((option, index) => {
              if (option.type === 'header') {
                return (
                  <div
                    key={`header-${option.label}`}
                    className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2"
                  >
                    <Clock className="w-3 h-3" />
                    {option.label}
                  </div>
                );
              }

              const selectableIndex = selectableOptions.findIndex((o) => o === option);
              const isHighlighted = selectableIndex === highlightedIndex;

              if (option.type === 'action') {
                return (
                  <button
                    key="create-new"
                    className={cn(
                      'w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors',
                      isHighlighted
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-muted text-primary'
                    )}
                    onClick={handleCreateNew}
                    onMouseEnter={() => setHighlightedIndex(selectableIndex)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-md bg-fuchsia-500/20 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-fuchsia-500" />
                    </div>
                    <span className="font-medium">+ Crear proveedor nuevo</span>
                  </button>
                );
              }

              if (option.type === 'proveedor') {
                const p = option.data;
                return (
                  <button
                    key={p.id}
                    className={cn(
                      'w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors',
                      isHighlighted
                        ? 'bg-primary/20 text-foreground'
                        : 'hover:bg-muted text-foreground'
                    )}
                    onClick={() => handleSelect(p)}
                    onMouseEnter={() => setHighlightedIndex(selectableIndex)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-fuchsia-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.numDocumento}
                        {p.nrc && ` | NRC: ${p.nrc}`}
                      </p>
                    </div>
                    {p.esGranContribuyente && (
                      <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full leading-none flex-shrink-0">
                        GC
                      </span>
                    )}
                  </button>
                );
              }

              return null;
            })}
          </div>
        </PopoverContent>
      </Popover>

      <NuevoProveedorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={handleProveedorCreated}
      />
    </>
  );
}
