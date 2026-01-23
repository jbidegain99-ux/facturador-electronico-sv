'use client';

import * as React from 'react';
import { UserPlus, Loader2, AlertCircle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Cliente } from '@/types';

interface NuevoClienteModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (cliente: Cliente) => void;
  tipoDte?: '01' | '03';
}

// Tipos de documento segun MH
const TIPOS_DOCUMENTO = [
  { value: '36', label: 'NIT' },
  { value: '13', label: 'DUI' },
  { value: '02', label: 'Carnet de Residente' },
  { value: '03', label: 'Pasaporte' },
  { value: '37', label: 'Otro' },
];

// Departamentos de El Salvador
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

// Municipios por departamento (simplificado - primeros de cada departamento)
const MUNICIPIOS: Record<string, { value: string; label: string }[]> = {
  '01': [
    { value: '01', label: 'Ahuachapan' },
    { value: '02', label: 'Apaneca' },
    { value: '03', label: 'Atiquizaya' },
    { value: '04', label: 'Concepcion de Ataco' },
    { value: '05', label: 'El Refugio' },
  ],
  '06': [
    { value: '01', label: 'Aguilares' },
    { value: '02', label: 'Apopa' },
    { value: '03', label: 'Ayutuxtepeque' },
    { value: '04', label: 'Cuscatancingo' },
    { value: '05', label: 'Ciudad Delgado' },
    { value: '06', label: 'El Paisnal' },
    { value: '07', label: 'Guazapa' },
    { value: '08', label: 'Ilopango' },
    { value: '09', label: 'Mejicanos' },
    { value: '10', label: 'Nejapa' },
    { value: '11', label: 'Panchimalco' },
    { value: '12', label: 'Rosario de Mora' },
    { value: '13', label: 'San Marcos' },
    { value: '14', label: 'San Martin' },
    { value: '15', label: 'San Salvador' },
    { value: '16', label: 'Santiago Texacuangos' },
    { value: '17', label: 'Santo Tomas' },
    { value: '18', label: 'Soyapango' },
    { value: '19', label: 'Tonacatepeque' },
  ],
  // Add more as needed...
};

// Default municipios when department is not in the map
const DEFAULT_MUNICIPIOS = [
  { value: '01', label: 'Municipio 1' },
  { value: '02', label: 'Municipio 2' },
];

interface FormData {
  tipoDocumento: string;
  numDocumento: string;
  nombre: string;
  nrc: string;
  telefono: string;
  correo: string;
  departamento: string;
  municipio: string;
  complemento: string;
}

interface FormErrors {
  tipoDocumento?: string;
  numDocumento?: string;
  nombre?: string;
  nrc?: string;
  correo?: string;
  general?: string;
}

export function NuevoClienteModal({
  open,
  onClose,
  onCreated,
  tipoDte = '01',
}: NuevoClienteModalProps) {
  const [formData, setFormData] = React.useState<FormData>({
    tipoDocumento: '13',
    numDocumento: '',
    nombre: '',
    nrc: '',
    telefono: '',
    correo: '',
    departamento: '06',
    municipio: '15',
    complemento: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        tipoDocumento: tipoDte === '03' ? '36' : '13',
        numDocumento: '',
        nombre: '',
        nrc: '',
        telefono: '',
        correo: '',
        departamento: '06',
        municipio: '15',
        complemento: '',
      });
      setErrors({});
    }
  }, [open, tipoDte]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.tipoDocumento) {
      newErrors.tipoDocumento = 'Selecciona el tipo de documento';
    }

    if (!formData.numDocumento.trim()) {
      newErrors.numDocumento = 'Numero de documento requerido';
    } else {
      // Validate format based on type
      if (formData.tipoDocumento === '36') {
        // NIT: 14 or 9 digits
        const nitClean = formData.numDocumento.replace(/[^0-9]/g, '');
        if (nitClean.length !== 14 && nitClean.length !== 9) {
          newErrors.numDocumento = 'NIT debe tener 9 o 14 digitos';
        }
      } else if (formData.tipoDocumento === '13') {
        // DUI: 9 digits
        const duiClean = formData.numDocumento.replace(/[^0-9]/g, '');
        if (duiClean.length !== 9) {
          newErrors.numDocumento = 'DUI debe tener 9 digitos';
        }
      }
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'Nombre o razon social requerido';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'Nombre debe tener al menos 3 caracteres';
    }

    // CCF requires NRC
    if (tipoDte === '03' && !formData.nrc.trim()) {
      newErrors.nrc = 'NRC requerido para Credito Fiscal';
    }

    // Validate email format if provided
    if (formData.correo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        newErrors.correo = 'Correo no valido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${apiUrl}/api/v1/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tipoDocumento: formData.tipoDocumento,
          numDocumento: formData.numDocumento.trim(),
          nombre: formData.nombre.trim(),
          nrc: formData.nrc.trim() || undefined,
          telefono: formData.telefono.trim() || undefined,
          correo: formData.correo.trim() || undefined,
          direccion: {
            departamento: formData.departamento,
            municipio: formData.municipio,
            complemento: formData.complemento.trim() || 'Sin especificar',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear cliente');
      }

      const cliente = await response.json();
      onCreated(cliente);
      onClose();
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Error al crear cliente',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const municipiosDisponibles = MUNICIPIOS[formData.departamento] || DEFAULT_MUNICIPIOS;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg bg-[#0f0f1a] border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg text-white">Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Ingresa los datos del cliente para agregarlo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {errors.general && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Tipo de documento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Tipo de Documento *
              </label>
              <Select
                value={formData.tipoDocumento}
                onValueChange={(value) => handleChange('tipoDocumento', value)}
              >
                <SelectTrigger className="input-rc">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12121a] border-border">
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <SelectItem
                      key={tipo.value}
                      value={tipo.value}
                      className="text-white hover:bg-primary/20 focus:bg-primary/20"
                    >
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipoDocumento && (
                <p className="text-xs text-destructive">{errors.tipoDocumento}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Numero de Documento *
              </label>
              <Input
                value={formData.numDocumento}
                onChange={(e) => handleChange('numDocumento', e.target.value)}
                placeholder={formData.tipoDocumento === '36' ? '0614-123456-101-2' : '01234567-8'}
                className="input-rc"
              />
              {errors.numDocumento && (
                <p className="text-xs text-destructive">{errors.numDocumento}</p>
              )}
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Nombre / Razon Social *
            </label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre completo o razon social"
              className="input-rc"
            />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
          </div>

          {/* NRC (required for CCF) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                NRC {tipoDte === '03' && '*'}
              </label>
              <Input
                value={formData.nrc}
                onChange={(e) => handleChange('nrc', e.target.value)}
                placeholder="1234567"
                className="input-rc"
              />
              {errors.nrc && <p className="text-xs text-destructive">{errors.nrc}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Telefono</label>
              <Input
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="2222-3333"
                className="input-rc"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Correo Electronico</label>
            <Input
              type="email"
              value={formData.correo}
              onChange={(e) => handleChange('correo', e.target.value)}
              placeholder="correo@ejemplo.com"
              className="input-rc"
            />
            {errors.correo && <p className="text-xs text-destructive">{errors.correo}</p>}
          </div>

          {/* Direccion */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Departamento</label>
              <Select
                value={formData.departamento}
                onValueChange={(value) => {
                  handleChange('departamento', value);
                  // Reset municipio when department changes
                  const muns = MUNICIPIOS[value] || DEFAULT_MUNICIPIOS;
                  setFormData((prev) => ({ ...prev, municipio: muns[0]?.value || '01' }));
                }}
              >
                <SelectTrigger className="input-rc">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12121a] border-border max-h-[200px]">
                  {DEPARTAMENTOS.map((depto) => (
                    <SelectItem
                      key={depto.value}
                      value={depto.value}
                      className="text-white hover:bg-primary/20 focus:bg-primary/20"
                    >
                      {depto.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Municipio</label>
              <Select
                value={formData.municipio}
                onValueChange={(value) => handleChange('municipio', value)}
              >
                <SelectTrigger className="input-rc">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12121a] border-border max-h-[200px]">
                  {municipiosDisponibles.map((muni) => (
                    <SelectItem
                      key={muni.value}
                      value={muni.value}
                      className="text-white hover:bg-primary/20 focus:bg-primary/20"
                    >
                      {muni.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Direccion Complementaria
            </label>
            <Input
              value={formData.complemento}
              onChange={(e) => handleChange('complemento', e.target.value)}
              placeholder="Colonia, calle, numero..."
              className="input-rc"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="btn-secondary">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Cliente'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
