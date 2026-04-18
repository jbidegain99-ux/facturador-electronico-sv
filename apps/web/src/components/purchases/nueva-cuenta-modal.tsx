'use client';

import * as React from 'react';
import { Loader2, BookOpen } from 'lucide-react';
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

export interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  accountType: string;
  level: number;
  allowsPosting: boolean;
}

interface NuevaCuentaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (cuenta: AccountingAccount) => void;
}

const ACCOUNT_TYPES = [
  { value: 'ASSET', label: 'Activo' },
  { value: 'LIABILITY', label: 'Pasivo' },
  { value: 'EQUITY', label: 'Capital' },
  { value: 'INCOME', label: 'Ingreso' },
  { value: 'EXPENSE', label: 'Gasto' },
];

const NORMAL_BALANCE_BY_TYPE: Record<string, string> = {
  ASSET: 'DEBIT',
  EXPENSE: 'DEBIT',
  LIABILITY: 'CREDIT',
  EQUITY: 'CREDIT',
  INCOME: 'CREDIT',
};

interface FormState {
  code: string;
  name: string;
  accountType: string;
  description: string;
}

const initialForm: FormState = {
  code: '',
  name: '',
  accountType: 'EXPENSE',
  description: '',
};

export function NuevaCuentaModal({ open, onOpenChange, onCreated }: NuevaCuentaModalProps) {
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

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const cuenta = await apiFetch<AccountingAccount>('/accounting/accounts', {
        method: 'POST',
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          accountType: form.accountType,
          normalBalance: NORMAL_BALANCE_BY_TYPE[form.accountType] ?? 'DEBIT',
          level: 4,
          allowsPosting: true,
          description: form.description.trim() || undefined,
        }),
      });

      toast.success(`Cuenta ${cuenta.code} — ${cuenta.name} creada`);
      onCreated(cuenta);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error creando cuenta';
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
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <DialogTitle className="text-lg">Nueva cuenta contable</DialogTitle>
              <DialogDescription>Registra una cuenta en el plan de cuentas</DialogDescription>
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

          <div className="space-y-2">
            <Label>
              Codigo <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="Ej. 5101"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ej. Compras de mercaderia"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Tipo de cuenta <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.accountType}
              onValueChange={(v) => handleChange('accountType', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descripcion (opcional)</Label>
            <Input
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descripcion breve"
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
              'Crear cuenta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
