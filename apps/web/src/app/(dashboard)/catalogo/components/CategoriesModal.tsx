'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import type { CatalogCategory } from './catalog-types';
import { CATEGORY_COLORS } from './catalog-types';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CatalogCategory[];
  onCreateCategory: (name: string, color: string) => Promise<void>;
  onUpdateCategory: (cat: CatalogCategory, name: string, color: string) => Promise<void>;
  onDeleteCategory: (cat: CatalogCategory) => void;
  saving: boolean;
  tc: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
}

export function CategoriesModal({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  saving,
  tc,
  tCommon,
}: CategoriesModalProps) {
  const [newCatName, setNewCatName] = React.useState('');
  const [newCatColor, setNewCatColor] = React.useState(CATEGORY_COLORS[0]);
  const [editingCat, setEditingCat] = React.useState<CatalogCategory | null>(null);
  const [editCatName, setEditCatName] = React.useState('');
  const [editCatColor, setEditCatColor] = React.useState('');

  const handleCreate = async () => {
    if (!newCatName.trim()) return;
    await onCreateCategory(newCatName.trim(), newCatColor);
    setNewCatName('');
  };

  const handleUpdate = async () => {
    if (!editingCat || !editCatName.trim()) return;
    await onUpdateCategory(editingCat, editCatName.trim(), editCatColor);
    setEditingCat(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setEditingCat(null); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tc('manageCategories')}</DialogTitle>
          <DialogDescription>{tc('manageCategoriesDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new category */}
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label>{tc('newCategory')}</Label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={tc('categoryNamePlaceholder')}
                maxLength={100}
              />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="flex gap-1">
                {CATEGORY_COLORS.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${newCatColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewCatColor(c)}
                  />
                ))}
              </div>
            </div>
            <Button size="sm" onClick={handleCreate} disabled={saving || !newCatName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {/* Category list */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{tc('noCategories')}</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-md border">
                  {editingCat?.id === cat.id ? (
                    <>
                      <Input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="h-8 text-sm flex-1"
                        maxLength={100}
                      />
                      <div className="flex gap-0.5">
                        {CATEGORY_COLORS.slice(0, 5).map((c) => (
                          <button
                            key={c}
                            className={`w-4 h-4 rounded-full border ${editCatColor === c ? 'border-foreground' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setEditCatColor(c)}
                          />
                        ))}
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleUpdate} disabled={saving}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCat(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#6366f1' }} />
                      <span className="flex-1 text-sm font-medium">{cat.name}</span>
                      <span className="text-xs text-muted-foreground">{cat._count?.items || 0} items</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => { setEditingCat(cat); setEditCatName(cat.name); setEditCatColor(cat.color || CATEGORY_COLORS[0]); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onDeleteCategory(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tCommon('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
