'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  Star,
  Plus,
} from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import type { CatalogItem } from './catalog-types';
import { TYPE_COLORS, TRIBUTO_OPTIONS, formatPrice } from './catalog-types';

interface CatalogTableProps {
  items: CatalogItem[];
  loading: boolean;
  fetchError: string | null;
  total: number;
  totalPages: number;
  page: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isAtLimit: boolean | null | 0;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  onToggleFavorite: (item: CatalogItem) => void;
  onEdit: (item: CatalogItem) => void;
  onDelete: (item: CatalogItem) => void;
  onCreateFirst: () => void;
  onRetry: () => void;
  tc: (key: string) => string;
  tCommon: (key: string) => string;
}

export function CatalogTable({
  items,
  loading,
  fetchError,
  total,
  totalPages,
  page,
  sortBy,
  sortOrder,
  isAtLimit,
  onSort,
  onPageChange,
  onToggleFavorite,
  onEdit,
  onDelete,
  onCreateFirst,
  onRetry,
  tc,
  tCommon,
}: CatalogTableProps) {
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  if (loading) {
    return <SkeletonTable rows={5} />;
  }

  if (fetchError) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">{fetchError}</p>
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          {tCommon('retry')}
        </Button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">{tCommon('noResults')}</p>
        <Button variant="outline" className="mt-4" onClick={onCreateFirst} disabled={!!isAtLimit}>
          <Plus className="mr-2 h-4 w-4" />
          {tc('createFirst')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead className="cursor-pointer select-none" onClick={() => onSort('code')}>
              <div className="flex items-center">
                {tc('codeLabel')} {getSortIcon('code')}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onSort('name')}>
              <div className="flex items-center">
                {tc('nameLabel')} {getSortIcon('name')}
              </div>
            </TableHead>
            <TableHead>{tc('categoryLabel')}</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onSort('type')}>
              <div className="flex items-center">
                {tc('typeLabel')} {getSortIcon('type')}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onSort('basePrice')}>
              <div className="flex items-center">
                {tCommon('price')} {getSortIcon('basePrice')}
              </div>
            </TableHead>
            <TableHead>{tCommon('tax')}</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onSort('usageCount')}>
              <div className="flex items-center">
                {tc('uses')} {getSortIcon('usageCount')}
              </div>
            </TableHead>
            <TableHead className="text-right">{tCommon('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <button
                  onClick={() => onToggleFavorite(item)}
                  className="hover:scale-110 transition-transform"
                  title={item.isFavorite ? tc('removeFavorite') : tc('addFavorite')}
                >
                  <Star
                    className={`h-4 w-4 ${
                      item.isFavorite
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/40'
                    }`}
                  />
                </button>
              </TableCell>
              <TableCell className="font-mono text-sm">{item.code}</TableCell>
              <TableCell className="font-medium">
                {item.name}
                {item.description && (
                  <span className="block text-xs text-muted-foreground truncate max-w-[200px]">
                    {item.description}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {item.category ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: item.category.color ? `${item.category.color}20` : '#6366f120',
                      color: item.category.color || '#6366f1',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.category.color || '#6366f1' }} />
                    {item.category.name}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-800'
                }`}>
                  {item.type === 'PRODUCT' ? tc('product') : item.type === 'SERVICE' ? tc('service') : item.type}
                </span>
              </TableCell>
              <TableCell className="font-medium">{formatPrice(item.basePrice)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {TRIBUTO_OPTIONS.find((opt) => opt.value === item.tributo)?.label || tc('taxIva')}
              </TableCell>
              <TableCell className="text-center">{item.usageCount}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(item)}
                    title={tCommon('edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(item)}
                    title={tCommon('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        showing={items.length}
        onPageChange={onPageChange}
      />
    </>
  );
}
