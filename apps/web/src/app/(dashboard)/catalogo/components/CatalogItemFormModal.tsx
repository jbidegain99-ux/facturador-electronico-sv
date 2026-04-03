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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type {
  ItemForm,
  CatalogItem,
  CatalogCategory,
  UnidadMedida,
} from './catalog-types';
import {
  TRIBUTO_OPTIONS,
  TIPO_ITEM_OPTIONS,
  isFormValid,
  validateField,
} from './catalog-types';

interface CatalogItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: CatalogItem | null;
  formData: ItemForm;
  fieldErrors: Record<string, string>;
  saving: boolean;
  categories: CatalogCategory[];
  units: UnidadMedida[];
  onFormChange: (field: keyof ItemForm, value: string) => void;
  onTributoChange: (value: string) => void;
  onSave: () => void;
  tc: (key: string) => string;
  tCommon: (key: string) => string;
}

export function CatalogItemFormModal({
  isOpen,
  onClose,
  editingItem,
  formData,
  fieldErrors,
  saving,
  categories,
  units,
  onFormChange,
  onTributoChange,
  onSave,
  tc,
  tCommon,
}: CatalogItemFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? tc('editItem') : tc('newItem')}
          </DialogTitle>
          <DialogDescription>
            {editingItem ? tc('editDesc') : tc('createDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type radio */}
          <div className="space-y-1">
            <Label>{tc('typeLabel')} *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="itemType"
                  value="PRODUCT"
                  checked={formData.type === 'PRODUCT'}
                  onChange={() => onFormChange('type', 'PRODUCT')}
                  className="accent-primary"
                />
                <span className="text-sm">{tc('product')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="itemType"
                  value="SERVICE"
                  checked={formData.type === 'SERVICE'}
                  onChange={() => onFormChange('type', 'SERVICE')}
                  className="accent-primary"
                />
                <span className="text-sm">{tc('service')}</span>
              </label>
            </div>
          </div>

          {/* Code + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{tc('codeLabel')} *</Label>
              <Input
                value={formData.code}
                onChange={(e) => onFormChange('code', e.target.value)}
                placeholder="PRD-001"
                maxLength={50}
                className={fieldErrors.code ? 'border-red-500' : ''}
              />
              {fieldErrors.code && (
                <p className="text-xs text-red-500">{fieldErrors.code}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>{tc('nameLabel')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                placeholder="Nombre del producto o servicio"
                maxLength={200}
                className={fieldErrors.name ? 'border-red-500' : ''}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-500">{fieldErrors.name}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label>{tc('categoryLabel')}</Label>
            <Select value={formData.categoryId || '_none'} onValueChange={(v) => onFormChange('categoryId', v === '_none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={tc('noCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{tc('noCategory')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      {cat.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>{tc('descriptionLabel')}</Label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormChange('description', e.target.value)}
              placeholder="Descripcion opcional del item"
              maxLength={500}
              rows={2}
              className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                fieldErrors.description ? 'border-red-500' : 'border-input'
              }`}
            />
            {fieldErrors.description && (
              <p className="text-xs text-red-500">{fieldErrors.description}</p>
            )}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{tc('basePriceLabel')} *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => onFormChange('basePrice', e.target.value)}
                placeholder="0.00"
                className={fieldErrors.basePrice ? 'border-red-500' : ''}
              />
              {fieldErrors.basePrice && (
                <p className="text-xs text-red-500">{fieldErrors.basePrice}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>{tc('costPriceLabel')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => onFormChange('costPrice', e.target.value)}
                placeholder="0.00"
                className={fieldErrors.costPrice ? 'border-red-500' : ''}
              />
              {fieldErrors.costPrice && (
                <p className="text-xs text-red-500">{fieldErrors.costPrice}</p>
              )}
            </div>
          </div>

          {/* Unit + Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{tc('unitLabel')}</Label>
              <Select
                value={formData.uniMedida}
                onValueChange={(v) => onFormChange('uniMedida', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tc('selectUnit')} />
                </SelectTrigger>
                <SelectContent>
                  {units.length > 0 ? (
                    units.map((u) => (
                      <SelectItem key={u.codigo} value={String(u.codigo)}>
                        {u.descripcion}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="99">Otra (Unidad)</SelectItem>
                      <SelectItem value="36">Hora</SelectItem>
                      <SelectItem value="59">Servicio</SelectItem>
                      <SelectItem value="1">Metro</SelectItem>
                      <SelectItem value="23">Libra</SelectItem>
                      <SelectItem value="21">Kilogramo</SelectItem>
                      <SelectItem value="40">Pieza</SelectItem>
                      <SelectItem value="34">Docena</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{tc('taxProfileLabel')}</Label>
              <Select
                value={formData.tributo}
                onValueChange={onTributoChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tc('selectTax')} />
                </SelectTrigger>
                <SelectContent>
                  {TRIBUTO_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tipo Item MH */}
          <div className="space-y-1">
            <Label>{tc('mhTypeLabel')}</Label>
            <Select
              value={formData.tipoItem}
              onValueChange={(v) => onFormChange('tipoItem', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={tc('selectType')} />
              </SelectTrigger>
              <SelectContent>
                {TIPO_ITEM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || !isFormValid(formData)}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingItem ? tCommon('save') : tCommon('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
