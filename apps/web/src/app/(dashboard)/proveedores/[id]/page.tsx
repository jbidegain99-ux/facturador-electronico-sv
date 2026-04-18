'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Save,
  Truck,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';
import type { Proveedor, Purchase, PurchaseStatus } from '@/types/purchase';

const TIPOS_DOCUMENTO = [
  { value: '36', label: 'NIT' },
  { value: '13', label: 'DUI' },
  { value: '02', label: 'Carnet de Residente' },
  { value: '03', label: 'Pasaporte' },
  { value: '37', label: 'Otro' },
];

type BadgeVariant = 'secondary' | 'default' | 'outline' | 'destructive';

function estadoBadgeVariant(estado: PurchaseStatus): BadgeVariant {
  const map: Record<PurchaseStatus, BadgeVariant> = {
    DRAFT: 'secondary',
    POSTED: 'default',
    PAID: 'outline',
    ANULADA: 'destructive',
  };
  return map[estado] ?? 'secondary';
}

interface ProveedorForm {
  nombre: string;
  tipoDocumento: string;
  numDocumento: string;
  nrc: string;
  correo: string;
  telefono: string;
  complemento: string;
  esGranContribuyente: boolean;
  retieneISR: boolean;
}

interface PurchasesListResponse {
  data: Purchase[];
  total: number;
}

export default function ProveedorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const toast = useToast();

  const [proveedor, setProveedor] = React.useState<Proveedor | null>(null);
  const [loadingProveedor, setLoadingProveedor] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  const [purchases, setPurchases] = React.useState<Purchase[]>([]);

  const [form, setForm] = React.useState<ProveedorForm | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Load proveedor
  React.useEffect(() => {
    if (!id) return;
    setLoadingProveedor(true);
    apiFetch<Proveedor>(`/clientes/${id}`)
      .then((p) => {
        setProveedor(p);
        setForm({
          nombre: p.nombre,
          tipoDocumento: p.tipoDocumento,
          numDocumento: p.numDocumento,
          nrc: p.nrc ?? '',
          correo: p.correo ?? '',
          telefono: p.telefono ?? '',
          complemento: (() => {
            try {
              const d =
                typeof p.direccion === 'string'
                  ? (JSON.parse(p.direccion) as { complemento?: string })
                  : (p.direccion as { complemento?: string });
              return d?.complemento ?? '';
            } catch {
              return '';
            }
          })(),
          esGranContribuyente: p.esGranContribuyente,
          retieneISR: p.retieneISR,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingProveedor(false));
  }, [id]);

  // Load purchases history
  React.useEffect(() => {
    if (!id) return;
    apiFetch<PurchasesListResponse>(`/purchases?proveedorId=${id}&limit=10`)
      .then((d) => setPurchases(d.data ?? []))
      .catch(() => {
        // purchases history is non-critical; silent fail
      });
  }, [id]);

  const handleChange = (field: keyof ProveedorForm, value: string | boolean) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveError(null);

    try {
      await apiFetch(`/clientes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          tipoDocumento: form.tipoDocumento,
          numDocumento: form.numDocumento.trim(),
          nrc: form.nrc.trim() || undefined,
          correo: form.correo.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
          direccion: JSON.stringify({
            complemento: form.complemento.trim() || 'El Salvador',
          }),
          esGranContribuyente: form.esGranContribuyente,
          retieneISR: form.retieneISR,
          isSupplier: true,
        }),
      });

      toast.success('Proveedor actualizado correctamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar proveedor';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProveedor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !proveedor) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Proveedor no encontrado</p>
        <Link href="/proveedores">
          <Button variant="outline" className="mt-4">
            Volver a Proveedores
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl">
      {/* Back button */}
      <Link href="/proveedores">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Proveedores
        </Button>
      </Link>

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
          <Truck className="w-6 h-6 text-fuchsia-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{proveedor.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {proveedor.tipoDocumento === '36' ? 'NIT' : 'DUI'}: {proveedor.numDocumento}
          </p>
        </div>
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del proveedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {saveError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {form && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombre / Razon Social *</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>Correo Electronico</Label>
                <Input
                  type="email"
                  value={form.correo}
                  onChange={(e) => handleChange('correo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Direccion</Label>
                <Input
                  value={form.complemento}
                  onChange={(e) => handleChange('complemento', e.target.value)}
                  placeholder="Colonia, calle, numero..."
                />
              </div>

              <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="gc-edit"
                    checked={form.esGranContribuyente}
                    onCheckedChange={(v) => handleChange('esGranContribuyente', !!v)}
                  />
                  <Label htmlFor="gc-edit" className="cursor-pointer text-sm">
                    Es gran contribuyente (retiene IVA 1%)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isr-edit"
                    checked={form.retieneISR}
                    onCheckedChange={(v) => handleChange('retieneISR', !!v)}
                  />
                  <Label htmlFor="isr-edit" className="cursor-pointer text-sm">
                    Retener ISR
                  </Label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.nombre.trim()}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar cambios
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/proveedores')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Purchase history */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-violet-500" />
            <CardTitle>Historial de compras</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {purchases.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No hay compras registradas para este proveedor</p>
              <Link href="/compras/nueva">
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Nueva compra
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N Documento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/compras/${p.id}`}
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        {p.numDocumentoProveedor}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.fechaDoc).toLocaleDateString('es-SV')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${p.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={estadoBadgeVariant(p.estado)}>{p.estado}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
