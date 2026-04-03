'use client';

import * as React from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Banknote, CreditCard, Building2, Receipt, HelpCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type TipoMetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'TARJETA' | 'OTRA';

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dteId: string;
  onSuccess: () => void;
  onSkip: () => void;
}

const PAYMENT_OPTIONS: { value: TipoMetodoPago; label: string; icon: React.ReactNode; cuenta: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: <Banknote className="w-4 h-4" />, cuenta: '1001 - Caja' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: <Building2 className="w-4 h-4" />, cuenta: '1105 - Banco' },
  { value: 'CHEQUE', label: 'Cheque', icon: <Receipt className="w-4 h-4" />, cuenta: '1106 - Cheques por cobrar' },
  { value: 'TARJETA', label: 'Tarjeta', icon: <CreditCard className="w-4 h-4" />, cuenta: '1201 - Cuentas por cobrar' },
  { value: 'OTRA', label: 'Otra', icon: <HelpCircle className="w-4 h-4" />, cuenta: '1102 - Otros' },
];

export function PaymentMethodModal({
  open,
  onOpenChange,
  dteId,
  onSuccess,
  onSkip,
}: PaymentMethodModalProps) {
  const [tipo, setTipo] = React.useState<TipoMetodoPago>('EFECTIVO');
  const [referencia, setReferencia] = React.useState('');
  const [numeroCheque, setNumeroCheque] = React.useState('');
  const [bancoEmisor, setBancoEmisor] = React.useState('');
  const [numeroCuenta, setNumeroCuenta] = React.useState('');
  const [descripcion, setDescripcion] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          dteId,
          tipo,
          descripcion: descripcion || undefined,
          numeroCheque: tipo === 'CHEQUE' ? numeroCheque : undefined,
          bancoEmisor: tipo === 'CHEQUE' || tipo === 'TRANSFERENCIA' ? bancoEmisor : undefined,
          numeroCuenta: tipo === 'TRANSFERENCIA' || tipo === 'CHEQUE' ? numeroCuenta : undefined,
          referencia: tipo !== 'EFECTIVO' ? referencia : undefined,
        }),
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOption = PAYMENT_OPTIONS.find((o) => o.value === tipo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Seleccione el método de pago recibido para este documento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <RadioGroup
            value={tipo}
            onValueChange={(val) => setTipo(val as TipoMetodoPago)}
            className="grid grid-cols-1 gap-2"
          >
            {PAYMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  tipo === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value={option.value} />
                <span className="flex items-center gap-2 flex-1">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </span>
                <span className="text-xs text-muted-foreground">{option.cuenta}</span>
              </label>
            ))}
          </RadioGroup>

          {/* Conditional fields based on tipo */}
          {tipo === 'CHEQUE' && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              <div>
                <Label htmlFor="numeroCheque">N. Cheque *</Label>
                <Input
                  id="numeroCheque"
                  value={numeroCheque}
                  onChange={(e) => setNumeroCheque(e.target.value)}
                  placeholder="000123"
                />
              </div>
              <div>
                <Label htmlFor="bancoEmisorCheque">Banco Emisor</Label>
                <Input
                  id="bancoEmisorCheque"
                  value={bancoEmisor}
                  onChange={(e) => setBancoEmisor(e.target.value)}
                  placeholder="Banco Agricola"
                />
              </div>
              <div>
                <Label htmlFor="numeroCuentaCheque">N. Cuenta</Label>
                <Input
                  id="numeroCuentaCheque"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  placeholder="1234567890"
                />
              </div>
            </div>
          )}

          {tipo === 'TRANSFERENCIA' && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              <div>
                <Label htmlFor="referenciaTrans">Referencia</Label>
                <Input
                  id="referenciaTrans"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="REF-2026-001"
                />
              </div>
              <div>
                <Label htmlFor="bancoEmisorTrans">Banco</Label>
                <Input
                  id="bancoEmisorTrans"
                  value={bancoEmisor}
                  onChange={(e) => setBancoEmisor(e.target.value)}
                  placeholder="Banco Agricola"
                />
              </div>
              <div>
                <Label htmlFor="numeroCuentaTrans">N. Cuenta</Label>
                <Input
                  id="numeroCuentaTrans"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  placeholder="1234567890"
                />
              </div>
            </div>
          )}

          {tipo === 'TARJETA' && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              <div>
                <Label htmlFor="referenciaTarjeta">Referencia / Autorizacion</Label>
                <Input
                  id="referenciaTarjeta"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="AUTH-123456"
                />
              </div>
            </div>
          )}

          {tipo === 'OTRA' && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              <div>
                <Label htmlFor="descripcionOtra">Descripción</Label>
                <Input
                  id="descripcionOtra"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalle del metodo de pago"
                />
              </div>
              <div>
                <Label htmlFor="referenciaOtra">Referencia</Label>
                <Input
                  id="referenciaOtra"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="REF-001"
                />
              </div>
            </div>
          )}

          {selectedOption && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Cuenta contable: </span>
              <span className="font-mono font-medium">{selectedOption.cuenta}</span>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive p-3 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onSkip} disabled={isSubmitting}>
            Omitir
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (tipo === 'CHEQUE' && !numeroCheque)}
            className="btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Pago'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
