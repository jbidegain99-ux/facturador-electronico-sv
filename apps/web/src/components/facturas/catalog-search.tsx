'use client';

import * as React from 'react';
import { Search, Star, Package, Loader2, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, formatCurrency } from '@/lib/utils';

interface CatalogItem {
  id: string;
  type: 'PRODUCT' | 'SERVICE';
  code: string;
  name: string;
  description?: string;
  basePrice: number;
  tipoItem: number;
  uniMedida: number;
  isFavorite: boolean;
  usageCount: number;
}

interface CatalogSearchProps {
  onSelect: (item: CatalogItem) => void;
  disabled?: boolean;
}

export type { CatalogItem };

export function CatalogSearch({ onSelect, disabled = false }: CatalogSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<CatalogItem[]>([]);
  const [recentItems, setRecentItems] = React.useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load recent items on mount
  React.useEffect(() => {
    const loadRecent = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/catalog-items/recent`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (Array.isArray(data)) {
          setRecentItems(data);
        }
      } catch {
        // Silently fail for recent items
      }
    };

    loadRecent();
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!search.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(
          `${apiUrl}/catalog-items/search?q=${encodeURIComponent(search)}&limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          setResults([]);
          return;
        }

        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
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

  const displayItems = search.trim() ? results : recentItems;
  const hasItems = displayItems.length > 0;

  const handleSelect = (item: CatalogItem) => {
    onSelect(item);
    setSearch('');
    setOpen(false);
    setHighlightedIndex(0);
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
        setHighlightedIndex((i) => Math.min(i + 1, displayItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (displayItems[highlightedIndex]) {
          handleSelect(displayItems[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

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
            placeholder="Buscar en catalogo por nombre o codigo..."
            className="pl-9 input-rc"
            disabled={disabled}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
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
          {/* Section header */}
          {hasItems && (
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border">
              {search.trim() ? (
                <>
                  <Search className="w-3 h-3" />
                  Resultados
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  Usados recientemente
                </>
              )}
            </div>
          )}

          {/* Loading state */}
          {isLoading && !hasItems && (
            <div className="px-4 py-6 text-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              <span className="text-sm">Buscando...</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && search.trim() && !hasItems && (
            <div className="px-4 py-6 text-center text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron items para &quot;{search}&quot;</p>
              <p className="text-xs mt-1">Puedes escribir el item manualmente abajo</p>
            </div>
          )}

          {/* No recent items */}
          {!isLoading && !search.trim() && !hasItems && (
            <div className="px-4 py-4 text-center text-muted-foreground">
              <p className="text-sm">Escribe para buscar en tu catalogo</p>
            </div>
          )}

          {/* Results list */}
          {displayItems.map((item, index) => (
            <button
              key={item.id}
              className={cn(
                'w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors',
                index === highlightedIndex
                  ? 'bg-primary/20 text-foreground'
                  : 'hover:bg-muted text-foreground'
              )}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Package className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{item.code}</span>
                  <span className="text-xs text-muted-foreground/50">|</span>
                  <span className="font-medium truncate">{item.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Number(item.basePrice))}
                  {item.type === 'SERVICE' && '/hr'}
                </p>
              </div>
              {item.isFavorite && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
