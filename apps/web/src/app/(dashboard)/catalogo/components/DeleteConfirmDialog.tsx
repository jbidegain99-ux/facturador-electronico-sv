'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { CatalogItem } from './catalog-types';

interface DeleteConfirmDialogProps {
  item: CatalogItem | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tc: (key: string, values?: Record<string, string>) => string;
  tCommon: (key: string) => string;
}

export function DeleteConfirmDialog({
  item,
  deleting,
  onConfirm,
  onCancel,
  tc,
  tCommon,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tc('deleteItem')}</DialogTitle>
          <DialogDescription>
            {tc('deleteConfirm', { name: item?.name ?? '', code: item?.code ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            {tCommon('cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
