'use client';

import * as React from 'react';
import { Search, X, User, Building2, Plus, Clock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Cliente } from '@/types';

// Constante para Consumidor Final
const CONSUMIDOR_FINAL: Cliente = {
  id: 'consumidor-final',
  tipoDocumento: '13',
  numDocumento: '00000000-0',
  nombre: 'Consumidor Final',
  createdAt: new Date().toISOString(),
};

interface ClienteSearchProps {
  value: Cliente | null;
  onChange: (cliente: Cliente | null) => void;
  onCreateNew: () => void;
  disabled?: boolean;
  tipoDte?: '01' | '03';
}

const RECENT_CLIENTS_PREFIX = 'factura-recent-clients';
const MAX_RECENT_CLIENTS = 5;

/** Build a tenant-scoped localStorage key to prevent cross-tenant leakage */
function getRecentClientsKey(): string {
  if (typeof window === 'undefined') return RECENT_CLIENTS_PREFIX;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      // Extract payload from JWT to get tenantId
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.tenantId) {
        return `${RECENT_CLIENTS_PREFIX}-${payload.tenantId}`;
      }
    }
  } catch {
    // Fall through to default
  }
  return RECENT_CLIENTS_PREFIX;
}

function getRecentClients(): Cliente[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getRecentClientsKey());
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentClient(cliente: Cliente): void {
  if (typeof window === 'undefined') return;
  if (cliente.id === 'consumidor-final') return;

  try {
    const key = getRecentClientsKey();
    const recents = getRecentClients().filter((c) => c.id !== cliente.id);
    recents.unshift(cliente);
    localStorage.setItem(
      key,
      JSON.stringify(recents.slice(0, MAX_RECENT_CLIENTS))
    );
  } catch {
    // Ignore localStorage errors
  }
}

export function ClienteSearch({
  value,
  onChange,
  onCreateNew,
  disabled = false,
  tipoDte = '01',
}: ClienteSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [recentClients, setRecentClients] = React.useState<Cliente[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load recent clients on mount and clean up old un-scoped key
  React.useEffect(() => {
    // Remove old global key that leaked across tenants
    try {
      localStorage.removeItem(RECENT_CLIENTS_PREFIX);
    } catch { /* ignore */ }
    setRecentClients(getRecentClients());
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!search.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(
          `${apiUrl}/clientes?search=${encodeURIComponent(search)}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Error al buscar clientes');
        }

        const data = await response.json();
        setResults(data.data || data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de búsqueda');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Get all options to display
  const getOptions = React.useCallback(() => {
    const options: Array<{ type: 'header' | 'cliente' | 'action'; data?: Cliente; label?: string }> = [];

    // If there's a search query
    if (search.trim()) {
      // Show results
      if (results.length > 0) {
        options.push({ type: 'header', label: 'Resultados' });
        results.forEach((cliente) => options.push({ type: 'cliente', data: cliente }));
      }

      // Always show Consumidor Final if matches
      if ('consumidor final'.includes(search.toLowerCase()) && tipoDte === '01') {
        options.push({ type: 'cliente', data: CONSUMIDOR_FINAL });
      }
    } else {
      // No search - show Consumidor Final for Factura (01)
      if (tipoDte === '01') {
        options.push({ type: 'cliente', data: CONSUMIDOR_FINAL });
      }

      // Show recent clients
      if (recentClients.length > 0) {
        options.push({ type: 'header', label: 'Recientes' });
        recentClients.forEach((cliente) => options.push({ type: 'cliente', data: cliente }));
      }
    }

    // Always show create new option
    options.push({ type: 'action', label: 'Crear nuevo cliente...' });

    return options;
  }, [search, results, recentClients, tipoDte]);

  const options = getOptions();
  const selectableOptions = options.filter((o) => o.type !== 'header');

  // Keyboard navigation
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
      case 'Enter':
        e.preventDefault();
        const selected = selectableOptions[highlightedIndex];
        if (selected?.type === 'cliente' && selected.data) {
          handleSelect(selected.data);
        } else if (selected?.type === 'action') {
          handleCreateNew();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const handleSelect = (cliente: Cliente) => {
    onChange(cliente);
    addRecentClient(cliente);
    setRecentClients(getRecentClients());
    setSearch('');
    setOpen(false);
    setHighlightedIndex(0);
  };

  const handleDeselect = () => {
    onChange(null);
  };

  const handleCreateNew = () => {
    setOpen(false);
    onCreateNew();
  };

  // If a client is selected, show the selected card
  if (value) {
    return (
      <div
        className={cn(
          'glass-card p-4 transition-all duration-200',
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
            {value.id === 'consumidor-final' ? (
              <User className="w-6 h-6 text-primary" />
            ) : (
              <span className="text-lg font-semibold text-primary">
                {value.nombre.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground truncate">{value.nombre}</h4>
              {value.nrc && (
                <span className="badge-info text-xs">Contribuyente</span>
              )}
            </div>

            <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
              <p>
                {value.tipoDocumento === '36' ? 'NIT' : 'DUI'}: {value.numDocumento}
                {value.nrc && ` | NRC: ${value.nrc}`}
              </p>

              {(value.correo || value.telefono) && (
                <p className="flex items-center gap-3">
                  {value.correo && (
                    <span className="truncate">
                      {value.correo}
                    </span>
                  )}
                  {value.telefono && (
                    <span>{value.telefono}</span>
                  )}
                </p>
              )}
            </div>
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
      </div>
    );
  }

  // Search input with popover
  return (
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
            placeholder="Buscar cliente por nombre, NIT, DUI..."
            className="pl-9 input-rc"
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
            <div className="px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading && !results.length && (
            <div className="px-4 py-6 text-center text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-sm">Buscando...</span>
            </div>
          )}

          {!isLoading && search.trim() && results.length === 0 && !error && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No se encontraron clientes con "{search}"
            </div>
          )}

          {options.map((option, index) => {
            if (option.type === 'header') {
              return (
                <div
                  key={`header-${option.label}`}
                  className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2"
                >
                  {option.label === 'Recientes' && <Clock className="w-3 h-3" />}
                  {option.label === 'Resultados' && <Star className="w-3 h-3" />}
                  {option.label}
                </div>
              );
            }

            const selectableIndex = selectableOptions.findIndex(
              (o) => o === option
            );
            const isHighlighted = selectableIndex === highlightedIndex;

            if (option.type === 'cliente' && option.data) {
              const cliente = option.data;
              const isConsumidorFinal = cliente.id === 'consumidor-final';

              return (
                <button
                  key={cliente.id}
                  className={cn(
                    'w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors',
                    isHighlighted
                      ? 'bg-primary/20 text-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                  onClick={() => handleSelect(cliente)}
                  onMouseEnter={() => setHighlightedIndex(selectableIndex)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    {isConsumidorFinal ? (
                      <User className="w-4 h-4 text-muted-foreground" />
                    ) : cliente.nrc ? (
                      <Building2 className="w-4 h-4 text-primary" />
                    ) : (
                      <User className="w-4 h-4 text-secondary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{cliente.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cliente.numDocumento}
                      {cliente.nrc && ` | NRC: ${cliente.nrc}`}
                    </p>
                  </div>
                </button>
              );
            }

            if (option.type === 'action') {
              return (
                <button
                  key="create-new"
                  className={cn(
                    'w-full px-3 py-2.5 flex items-center gap-3 text-left border-t border-border transition-colors',
                    isHighlighted
                      ? 'bg-primary/20 text-primary'
                      : 'hover:bg-muted text-primary'
                  )}
                  onClick={handleCreateNew}
                  onMouseEnter={() => setHighlightedIndex(selectableIndex)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            }

            return null;
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
