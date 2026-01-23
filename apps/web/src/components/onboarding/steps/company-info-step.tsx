'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { CompanyInfoForm, OnboardingState } from '@/types/onboarding';

interface CompanyInfoStepProps {
  data?: Partial<OnboardingState>;
  onSubmit: (data: CompanyInfoForm) => void;
  onBack: () => void;
  loading?: boolean;
}

export function CompanyInfoStep({
  data,
  onSubmit,
  onBack,
  loading,
}: CompanyInfoStepProps) {
  const [formData, setFormData] = React.useState<CompanyInfoForm>({
    nit: data?.nit || '',
    nrc: data?.nrc || '',
    razonSocial: data?.razonSocial || '',
    nombreComercial: data?.nombreComercial || '',
    actividadEconomica: data?.actividadEconomica || '',
    emailHacienda: data?.emailHacienda || '',
    telefonoHacienda: data?.telefonoHacienda || '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleChange = (field: keyof CompanyInfoForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nit) {
      newErrors.nit = 'El NIT es requerido';
    } else if (!/^\d{4}-\d{6}-\d{3}-\d$/.test(formData.nit)) {
      newErrors.nit = 'Formato inválido. Use: 0000-000000-000-0';
    }

    if (formData.nrc && !/^\d{1,7}-\d$/.test(formData.nrc)) {
      newErrors.nrc = 'Formato inválido. Use: 0000000-0';
    }

    if (!formData.razonSocial) {
      newErrors.razonSocial = 'La razón social es requerida';
    }

    if (!formData.actividadEconomica) {
      newErrors.actividadEconomica = 'La actividad económica es requerida';
    }

    if (!formData.emailHacienda) {
      newErrors.emailHacienda = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailHacienda)) {
      newErrors.emailHacienda = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Información de la Empresa</h2>
          <p className="text-muted-foreground">
            Datos del contribuyente para el registro en Hacienda
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos Fiscales</CardTitle>
            <CardDescription>
              Información de identificación tributaria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nit">
                  NIT <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nit"
                  placeholder="0000-000000-000-0"
                  value={formData.nit}
                  onChange={(e) => handleChange('nit', e.target.value)}
                  className={errors.nit ? 'border-red-500' : ''}
                />
                {errors.nit && (
                  <p className="text-sm text-red-500">{errors.nit}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nrc">NRC</Label>
                <Input
                  id="nrc"
                  placeholder="0000000-0"
                  value={formData.nrc}
                  onChange={(e) => handleChange('nrc', e.target.value)}
                  className={errors.nrc ? 'border-red-500' : ''}
                />
                {errors.nrc && (
                  <p className="text-sm text-red-500">{errors.nrc}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razonSocial">
                Razón Social <span className="text-red-500">*</span>
              </Label>
              <Input
                id="razonSocial"
                placeholder="Mi Empresa S.A. de C.V."
                value={formData.razonSocial}
                onChange={(e) => handleChange('razonSocial', e.target.value)}
                className={errors.razonSocial ? 'border-red-500' : ''}
              />
              {errors.razonSocial && (
                <p className="text-sm text-red-500">{errors.razonSocial}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombreComercial">Nombre Comercial</Label>
              <Input
                id="nombreComercial"
                placeholder="Nombre comercial (opcional)"
                value={formData.nombreComercial}
                onChange={(e) => handleChange('nombreComercial', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actividadEconomica">
                Actividad Económica <span className="text-red-500">*</span>
              </Label>
              <Input
                id="actividadEconomica"
                placeholder="Código o descripción de actividad"
                value={formData.actividadEconomica}
                onChange={(e) =>
                  handleChange('actividadEconomica', e.target.value)
                }
                className={errors.actividadEconomica ? 'border-red-500' : ''}
              />
              {errors.actividadEconomica && (
                <p className="text-sm text-red-500">
                  {errors.actividadEconomica}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto en Hacienda</CardTitle>
            <CardDescription>
              Información de contacto registrada en el Ministerio de Hacienda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailHacienda">
                  Email en Hacienda <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emailHacienda"
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={formData.emailHacienda}
                  onChange={(e) => handleChange('emailHacienda', e.target.value)}
                  className={errors.emailHacienda ? 'border-red-500' : ''}
                />
                {errors.emailHacienda && (
                  <p className="text-sm text-red-500">{errors.emailHacienda}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Email registrado en Servicios en Línea del MH
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefonoHacienda">Teléfono</Label>
                <Input
                  id="telefonoHacienda"
                  placeholder="0000-0000"
                  value={formData.telefonoHacienda}
                  onChange={(e) =>
                    handleChange('telefonoHacienda', e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
