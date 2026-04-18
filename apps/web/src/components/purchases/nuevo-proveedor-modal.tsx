'use client';

import * as React from 'react';
import { Loader2, Truck } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Proveedor } from '@/types/purchase';

interface NuevoProveedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (proveedor: Proveedor) => void;
}

const TIPOS_DOCUMENTO = [
  { value: '36', label: 'NIT' },
  { value: '13', label: 'DUI' },
  { value: '02', label: 'Carnet de Residente' },
  { value: '03', label: 'Pasaporte' },
  { value: '37', label: 'Otro' },
];

const DEPARTAMENTOS = [
  { value: '01', label: 'Ahuachapan' },
  { value: '02', label: 'Santa Ana' },
  { value: '03', label: 'Sonsonate' },
  { value: '04', label: 'Chalatenango' },
  { value: '05', label: 'La Libertad' },
  { value: '06', label: 'San Salvador' },
  { value: '07', label: 'Cuscatlan' },
  { value: '08', label: 'La Paz' },
  { value: '09', label: 'Cabanas' },
  { value: '10', label: 'San Vicente' },
  { value: '11', label: 'Usulutan' },
  { value: '12', label: 'San Miguel' },
  { value: '13', label: 'Morazan' },
  { value: '14', label: 'La Union' },
];

interface FormState {
  nombre: string;
  tipoDocumento: string;
  numDocumento: string;
  nrc: string;
  correo: string;
  telefono: string;
  departamento: string;
  municipio: string;
  complemento: string;
  esGranContribuyente: boolean;
  retieneISR: boolean;
}

const initialForm: FormState = {
  nombre: '',
  tipoDocumento: '36',
  numDocumento: '',
  nrc: '',
  correo: '',
  telefono: '',
  departamento: '06',
  municipio: '15',
  complemento: '',
  esGranContribuyente: false,
  retieneISR: false,
};

export function NuevoProveedorModal({ open, onOpenChange, onCreated }: NuevoProveedorModalProps) {
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const toast = useToast();

  React.useEffect(() => {
    if (open) {
      setForm(initialForm);
      setGeneralError(null);
    }
  }, [open]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.numDocumento.trim()) return;

    setSubmitting(true);
    setGeneralError(null);

    try {
      const body = {
        tipoDocumento: form.tipoDocumento,
        numDocumento: form.numDocumento.trim(),
        nombre: form.nombre.trim(),
        nrc: form.nrc.trim() || undefined,
        correo: form.correo.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        direccion: JSON.stringify({
          departamento: form.departamento,
          municipio: form.municipio,
          complemento: form.complemento.trim() || 'El Salvador',
        }),
        isSupplier: true,
        isCustomer: false,
        esGranContribuyente: form.esGranContribuyente,
        retieneISR: form.retieneISR,
      };

      const proveedor = await apiFetch<Proveedor>('/clientes', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      toast.success(`Proveedor ${proveedor.nombre} creado`);
      onCreated(proveedor);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error creando proveedor';
      setGeneralError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.nombre.trim().length >= 2 && form.numDocumento.trim().length >= 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-fuchsia-500" />
            </div>
            <div>
              <DialogTitle className="text-lg">Nuevo proveedor</DialogTitle>
              <DialogDescription>Registra un nuevo proveedor para compras</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {/* Tipo documento + numero */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Select
                value={form.tipoDocumento}
                onValueChange={(v) => handleChange('tipoDocumento', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Numero de Documento *</Label>
              <Input
                value={form.numDocumento}
                onChange={(e) => handleChange('numDocumento', e.target.value)}
                placeholder={form.tipoDocumento === '36' ? '0614-123456-101-2' : '01234567-8'}
              />
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label>Nombre / Razon Social *</Label>
            <Input
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre completo o razon social"
            />
          </div>

          {/* NRC + Telefono */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NRC</Label>
              <Input
                value={form.nrc}
                onChange={(e) => handleChange('nrc', e.target.value)}
                placeholder="367475-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input
                value={form.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="2222-3333"
              />
            </div>
          </div>

          {/* Correo */}
          <div className="space-y-2">
            <Label>Correo Electronico</Label>
            <Input
              type="email"
              value={form.correo}
              onChange={(e) => handleChange('correo', e.target.value)}
              placeholder="correo@empresa.com"
            />
          </div>

          {/* Departamento */}
          <div className="space-y-2">
            <Label>Departamento</Label>
            <Select
              value={form.departamento}
              onValueChange={(v) => handleChange('departamento', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {DEPARTAMENTOS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Complemento */}
          <div className="space-y-2">
            <Label>Direccion Complementaria</Label>
            <Input
              value={form.complemento}
              onChange={(e) => handleChange('complemento', e.target.value)}
              placeholder="Colonia, calle, numero..."
            />
          </div>

          {/* Flags */}
          <div className="space-y-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Checkbox
                id="gc"
                checked={form.esGranContribuyente}
                onCheckedChange={(v) => handleChange('esGranContribuyente', !!v)}
              />
              <Label htmlFor="gc" className="cursor-pointer text-sm">
                Es gran contribuyente (retiene IVA 1%)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isr"
                checked={form.retieneISR}
                onCheckedChange={(v) => handleChange('retieneISR', !!v)}
              />
              <Label htmlFor="isr" className="cursor-pointer text-sm">
                Retener ISR
              </Label>
            </div>
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
              'Crear proveedor'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
