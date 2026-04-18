'use client';

import * as React from 'react';
import { Loader2, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { CuentaSearch } from './cuenta-search';
import type { AccountingAccount } from './nueva-cuenta-modal';
import type { CatalogItem } from '@/components/facturas/catalog-search';

// Units of measure available in El Salvador MH catalog
const UNI_MEDIDA_OPTIONS = [
  { value: '59', label: '59 — Unidad' },
  { value: '94', label: '94 — Servicio' },
  { value: '01', label: '01 — Kilogramo' },
  { value: '02', label: '02 — Libra' },
  { value: '03', label: '03 — Litro' },
  { value: '04', label: '04 — Galón' },
  { value: '12', label: '12 — Metro' },
  { value: '33', label: '33 — Caja' },
  { value: '36', label: '36 — Paquete' },
];

interface NuevoItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (item: CatalogItem) => void;
}

interface FormState {
  code: string;
  name: string;
  uniMedida: string;
  cuentaInventarioId: string;
  costoInicial: string;
}

const initialForm: FormState = {
  code: '',
  name: '',
  uniMedida: '59',
  cuentaInventarioId: '',
  costoInicial: '',
};

export function NuevoItemModal({ open, onOpenChange, onCreated }: NuevoItemModalProps) {
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const toast = useToast();

  React.useEffect(() => {
    if (open) {
      setForm(initialForm);
      setError(null);
    }
  }, [open]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCuentaSelect = (cuenta: AccountingAccount) => {
    setForm((prev) => ({ ...prev, cuentaInventarioId: cuenta.id }));
  };

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        code: form.code.trim(),
        name: form.name.trim(),
        type: 'PRODUCT',
        uniMedida: Number(form.uniMedida),
        tipoItem: 1, // physical good
        basePrice: form.costoInicial ? Number(form.costoInicial) : 0,
        taxRate: 13,
      };

      if (form.cuentaInventarioId) {
        body.cuentaInventarioId = form.cuentaInventarioId;
      }

      const item = await apiFetch<CatalogItem>('/catalog-items', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      toast.success(`Item ${item.name} creado`);
      onCreated(item);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error creando item';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.code.trim().length >= 1 && form.name.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <DialogTitle className="text-lg">Nuevo item de catalogo</DialogTitle>
              <DialogDescription>Registra un producto para el catalogo de compras</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                SKU / Codigo <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Ej. PROD-001"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Unidad de medida <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.uniMedida}
                onValueChange={(v) => handleChange('uniMedida', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNI_MEDIDA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Nombre del producto <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nombre descriptivo del producto"
            />
          </div>

          <div className="space-y-2">
            <Label>Cuenta de inventario (opcional)</Label>
            <CuentaSearch
              onSelect={handleCuentaSelect}
              selected={form.cuentaInventarioId}
              placeholder="Buscar cuenta de inventario..."
            />
          </div>

          <div className="space-y-2">
            <Label>Costo inicial (opcional)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.costoInicial}
              onChange={(e) => handleChange('costoInicial', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !isValid}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear item'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
