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
import { Building2, ArrowRight, ArrowLeft, Loader2, Search, Check, ChevronsUpDown } from 'lucide-react';
import { CompanyInfoForm, OnboardingState } from '@/types/onboarding';
import { MaskedInput } from '@/components/ui/masked-input';

// Catálogo de Actividades Económicas (same as register page)
const ACTIVIDADES_ECONOMICAS = [
  { codigo: '01111', descripcion: 'Cultivo de cereales (excepto arroz), legumbres y semillas oleaginosas' },
  { codigo: '10101', descripcion: 'Elaboración y conservación de carne' },
  { codigo: '41001', descripcion: 'Construcción de edificios' },
  { codigo: '45101', descripcion: 'Venta de vehículos automotores' },
  { codigo: '46101', descripcion: 'Venta al por mayor a cambio de una comisión o por contrato' },
  { codigo: '46201', descripcion: 'Venta al por mayor de materias primas agropecuarias y animales vivos' },
  { codigo: '46311', descripcion: 'Venta al por mayor de frutas y verduras' },
  { codigo: '46321', descripcion: 'Venta al por mayor de carne y productos cárnicos' },
  { codigo: '46391', descripcion: 'Venta al por mayor de alimentos n.c.p.' },
  { codigo: '46411', descripcion: 'Venta al por mayor de productos textiles' },
  { codigo: '46491', descripcion: 'Venta al por mayor de otros enseres domésticos' },
  { codigo: '46511', descripcion: 'Venta al por mayor de computadoras y equipo periférico' },
  { codigo: '46521', descripcion: 'Venta al por mayor de equipo electrónico y de telecomunicaciones' },
  { codigo: '46591', descripcion: 'Venta al por mayor de maquinaria y equipo n.c.p.' },
  { codigo: '46901', descripcion: 'Venta al por mayor de otros productos' },
  { codigo: '47111', descripcion: 'Venta al por menor en almacenes no especializados' },
  { codigo: '47191', descripcion: 'Otras actividades de venta al por menor en almacenes no especializados' },
  { codigo: '47211', descripcion: 'Venta al por menor de frutas y verduras' },
  { codigo: '47221', descripcion: 'Venta al por menor de carne y productos cárnicos' },
  { codigo: '47301', descripcion: 'Venta al por menor de combustibles' },
  { codigo: '47411', descripcion: 'Venta al por menor de computadoras y equipo periférico' },
  { codigo: '47421', descripcion: 'Venta al por menor de equipo de sonido y video' },
  { codigo: '47511', descripcion: 'Venta al por menor de productos textiles' },
  { codigo: '47521', descripcion: 'Venta al por menor de artículos de ferretería' },
  { codigo: '47591', descripcion: 'Venta al por menor de muebles y equipo de iluminación' },
  { codigo: '47611', descripcion: 'Venta al por menor de libros' },
  { codigo: '47711', descripcion: 'Venta al por menor de prendas de vestir' },
  { codigo: '47721', descripcion: 'Venta al por menor de calzado' },
  { codigo: '47731', descripcion: 'Venta al por menor de productos farmacéuticos' },
  { codigo: '47741', descripcion: 'Venta al por menor de artículos médicos y ortopédicos' },
  { codigo: '47751', descripcion: 'Venta al por menor de cosméticos y artículos de tocador' },
  { codigo: '47911', descripcion: 'Venta al por menor por correo o por internet' },
  { codigo: '49111', descripcion: 'Transporte interurbano de pasajeros por ferrocarril' },
  { codigo: '49211', descripcion: 'Transporte urbano y suburbano de pasajeros' },
  { codigo: '49221', descripcion: 'Otras actividades de transporte de pasajeros' },
  { codigo: '49231', descripcion: 'Transporte de carga por carretera' },
  { codigo: '55101', descripcion: 'Actividades de alojamiento para estancias cortas' },
  { codigo: '56101', descripcion: 'Actividades de restaurantes y de servicio móvil de comidas' },
  { codigo: '56291', descripcion: 'Otras actividades de servicio de comidas' },
  { codigo: '56301', descripcion: 'Actividades de servicio de bebidas' },
  { codigo: '62011', descripcion: 'Actividades de programación informática' },
  { codigo: '62021', descripcion: 'Actividades de consultoría informática' },
  { codigo: '62091', descripcion: 'Otras actividades de tecnología de la información' },
  { codigo: '63111', descripcion: 'Procesamiento de datos, hospedaje y actividades conexas' },
  { codigo: '69101', descripcion: 'Actividades jurídicas' },
  { codigo: '69201', descripcion: 'Actividades de contabilidad, teneduría de libros y auditoría' },
  { codigo: '70101', descripcion: 'Actividades de oficinas principales' },
  { codigo: '70201', descripcion: 'Actividades de consultoría de gestión' },
  { codigo: '71101', descripcion: 'Actividades de arquitectura e ingeniería' },
  { codigo: '73111', descripcion: 'Agencias de publicidad' },
  { codigo: '74101', descripcion: 'Actividades especializadas de diseño' },
  { codigo: '74201', descripcion: 'Actividades de fotografía' },
  { codigo: '82111', descripcion: 'Actividades combinadas de servicios administrativos de oficina' },
  { codigo: '85101', descripcion: 'Enseñanza preescolar y primaria' },
  { codigo: '85211', descripcion: 'Enseñanza secundaria de formación general' },
  { codigo: '85301', descripcion: 'Enseñanza superior' },
  { codigo: '86101', descripcion: 'Actividades de hospitales' },
  { codigo: '86201', descripcion: 'Actividades de médicos y odontólogos' },
  { codigo: '86901', descripcion: 'Otras actividades de atención de la salud humana' },
  { codigo: '96011', descripcion: 'Lavado y limpieza de prendas de tela y de piel' },
  { codigo: '96021', descripcion: 'Peluquería y otros tratamientos de belleza' },
  { codigo: '96091', descripcion: 'Otras actividades de servicios personales n.c.p.' },
];

// Searchable dropdown for Actividad Económica
function ActivitySearchDropdown({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    if (!search) return ACTIVIDADES_ECONOMICAS;
    const lower = search.toLowerCase();
    return ACTIVIDADES_ECONOMICAS.filter(
      (a) =>
        a.codigo.includes(lower) ||
        a.descripcion.toLowerCase().includes(lower)
    );
  }, [search]);

  const selectedActivity = ACTIVIDADES_ECONOMICAS.find((a) => a.codigo === value);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          error ? 'border-red-500' : 'border-input'
        }`}
      >
        <span className={selectedActivity ? 'text-foreground truncate' : 'text-muted-foreground'}>
          {selectedActivity
            ? `${selectedActivity.codigo} - ${selectedActivity.descripcion}`
            : 'Seleccionar actividad económica...'}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="p-2">
            <div className="flex items-center gap-2 border rounded-md px-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código o descripción..."
                className="flex-1 py-2 text-sm bg-transparent outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No se encontraron resultados
              </div>
            ) : (
              filtered.map((act) => (
                <button
                  key={act.codigo}
                  type="button"
                  onClick={() => {
                    onChange(act.codigo);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                >
                  {value === act.codigo && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                  <span className={value === act.codigo ? 'font-medium' : ''}>
                    {act.codigo} - {act.descripcion}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Update form when navigating back to this step with existing data
  React.useEffect(() => {
    if (data) {
      setFormData({
        nit: data.nit || '',
        nrc: data.nrc || '',
        razonSocial: data.razonSocial || '',
        nombreComercial: data.nombreComercial || '',
        actividadEconomica: data.actividadEconomica || '',
        emailHacienda: data.emailHacienda || '',
        telefonoHacienda: data.telefonoHacienda || '',
      });
    }
  }, [data?.nit, data?.nrc, data?.razonSocial, data?.actividadEconomica, data?.emailHacienda]);

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
                <MaskedInput
                  mask="9999-999999-999-9"
                  id="nit"
                  name="nit"
                  required
                  placeholder="0000-000000-000-0"
                  value={formData.nit}
                  onValueChange={(masked) => handleChange('nit', masked)}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.nit ? 'border-red-500' : 'border-input'}`}
                />
                {errors.nit && (
                  <p className="text-sm text-red-500">{errors.nit}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nrc">NRC</Label>
                <MaskedInput
                  mask="999999-9"
                  id="nrc"
                  name="nrc"
                  placeholder="000000-0"
                  value={formData.nrc || ''}
                  onValueChange={(masked) => handleChange('nrc', masked)}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.nrc ? 'border-red-500' : 'border-input'}`}
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
              <ActivitySearchDropdown
                value={formData.actividadEconomica}
                onChange={(value) => handleChange('actividadEconomica', value)}
                error={!!errors.actividadEconomica}
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
                <MaskedInput
                  mask="9999-9999"
                  id="telefonoHacienda"
                  name="telefonoHacienda"
                  placeholder="0000-0000"
                  value={formData.telefonoHacienda || ''}
                  onValueChange={(masked) => handleChange('telefonoHacienda', masked)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
