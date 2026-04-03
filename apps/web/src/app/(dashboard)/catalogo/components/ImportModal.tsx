'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';
import type { ImportResult } from './catalog-types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importFile: File | null;
  importPreview: string[][] | null;
  importResult: ImportResult | null;
  importing: boolean;
  importSeparator: string;
  onSeparatorChange: (separator: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
  tc: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
}

export function ImportModal({
  isOpen,
  onClose,
  importFile,
  importPreview,
  importResult,
  importing,
  importSeparator,
  onSeparatorChange,
  onFileChange,
  onImport,
  onDownloadTemplate,
  tc,
  tCommon,
}: ImportModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tc('importCatalog')}</DialogTitle>
          <DialogDescription>{tc('importDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm text-muted-foreground">{tc('downloadTemplate')}</span>
            <Button size="sm" variant="outline" onClick={onDownloadTemplate}>
              <Download className="mr-2 h-3.5 w-3.5" />
              {tc('template')}
            </Button>
          </div>

          {/* File + Separator */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label>{tc('csvFile')}</Label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={onFileChange}
              />
            </div>
            <div className="space-y-1">
              <Label>{tc('separator')}</Label>
              <Select value={importSeparator} onValueChange={onSeparatorChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">{tc('comma')}</SelectItem>
                  <SelectItem value=";">{tc('semicolon')}</SelectItem>
                  <SelectItem value="\t">{tc('tab')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {importPreview && importPreview.length > 0 && (
            <div className="space-y-1">
              <Label>{tc('previewRows')}</Label>
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {importPreview[0].map((h, i) => (
                        <TableHead key={i} className="text-xs whitespace-nowrap">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.slice(1).map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="text-xs py-1 whitespace-nowrap">{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">{tc('importResult')}</span>
                <span className="text-green-600 dark:text-green-400">{tc('created', { count: importResult.created })}</span>
                <span className="text-blue-600 dark:text-blue-400">{tc('updated', { count: importResult.updated })}</span>
                {importResult.errors.length > 0 && (
                  <span className="text-red-600 dark:text-red-400">{tc('errors', { count: importResult.errors.length })}</span>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-red-600 dark:text-red-400">
                      Fila {err.row}: {err.field} - {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {importResult ? tCommon('close') : tCommon('cancel')}
          </Button>
          {!importResult && (
            <Button onClick={onImport} disabled={importing || !importFile}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('import')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
