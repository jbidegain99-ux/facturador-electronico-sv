'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { ClienteSearch } from '@/components/facturas/cliente-search';
import { CatalogSearch } from '@/components/facturas/catalog-search';
import type { CatalogItem } from '@/components/facturas/catalog-search';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Plus, Trash2, Save, Loader2, AlertCircle } from 'lucide-react';
import type { Cliente } from '@/types';
import Link from 'next/link';

interface TemplateItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

const DIAS_SEMANA = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miercoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sabado' },
];

export default function NuevoRecurrentePage() {
  const t = useTranslations('recurring');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const toast = useToast();

  const [checkingApi, setCheckingApi] = React.useState(true);
  const [apiUnavailable, setApiUnavailable] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [nombre, setNombre] = React.useState('');
  const [descripcion, setDescripcion] = React.useState('');
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [tipoDte, setTipoDte] = React.useState('01');
  const [interval, setInterval] = React.useState('MONTHLY');
  const [anchorDay, setAnchorDay] = React.useState('1');
  const [dayOfWeek, setDayOfWeek] = React.useState('1');
  const [mode, setMode] = React.useState('AUTO_DRAFT');
  const [autoTransmit, setAutoTransmit] = React.useState(false);
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = React.useState('');
  const [notas, setNotas] = React.useState('');
  const [items, setItems] = React.useState<TemplateItem[]>([
    { descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0 },
  ]);

  // Check if recurring invoices API is available
  React.useEffect(() => {
    const checkApi = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices?page=1&limit=1`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.status === 404) {
          setApiUnavailable(true);
        }
      } catch {
        setApiUnavailable(true);
      } finally {
        setCheckingApi(false);
      }
    };
    checkApi();
  }, []);

  const addItem = () => {
    setItems([...items, { descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TemplateItem, value: string | number) => {
    const updated = [...items];
    if (field === 'descripcion') {
      updated[index] = { ...updated[index], [field]: value as string };
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) || 0 };
    }
    setItems(updated);
  };

  const handleCatalogSelect = (catalogItem: CatalogItem) => {
    const newItem: TemplateItem = {
      descripcion: catalogItem.name,
      cantidad: 1,
      precioUnitario: Number(catalogItem.basePrice),
      descuento: 0,
    };
    setItems([...items, newItem]);
  };

  const totalEstimado = items.reduce((sum, item) => {
    return sum + item.cantidad * item.precioUnitario - item.descuento;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente) {
      toast.error(tCommon('required'));
      return;
    }
    if (!nombre.trim()) {
      toast.error(tCommon('required'));
      return;
    }
    if (items.some((i) => !i.descripcion.trim())) {
      toast.error(tCommon('required'));
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const body: Record<string, unknown> = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        clienteId: cliente.id,
        tipoDte,
        interval,
        mode,
        autoTransmit,
        items,
        startDate,
        notas: notas.trim() || undefined,
      };

      if (interval === 'MONTHLY' || interval === 'YEARLY') {
        body.anchorDay = parseInt(anchorDay, 10);
      }
      if (interval === 'WEEKLY') {
        body.dayOfWeek = parseInt(dayOfWeek, 10);
      }
      if (endDate) {
        body.endDate = endDate;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al crear template');
      }

      toast.success(tCommon('success'));
      router.push('/facturas/recurrentes');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon('error'));
    } finally {
      setSaving(false);
    }
  };

  if (checkingApi) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (apiUnavailable) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Link href="/facturas/recurrentes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t('newTemplate')}</h1>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-center">
              {t('serviceUnavailable')}
            </p>
            <Link href="/facturas/recurrentes" className="mt-4">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {tCommon('back')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/facturas/recurrentes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('newTemplate')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info basica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informacion Basica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Template *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Mensualidad Servicio Web"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoDte">Tipo de DTE</Label>
                <Select value={tipoDte} onValueChange={setTipoDte}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01">01 - Factura</SelectItem>
                    <SelectItem value="03">03 - Credito Fiscal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Input
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripcion opcional del template"
              />
            </div>

            <div className="space-y-2">
              <Label>Cliente *</Label>
              <ClienteSearch
                value={cliente}
                onChange={setCliente}
                onCreateNew={() => router.push('/clientes')}
                tipoDte={tipoDte as '01' | '03'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recurrencia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuracion de Recurrencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frecuencia *</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">{t('freqDaily')}</SelectItem>
                    <SelectItem value="WEEKLY">{t('freqWeekly')}</SelectItem>
                    <SelectItem value="MONTHLY">{t('freqMonthly')}</SelectItem>
                    <SelectItem value="YEARLY">{t('freqYearly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {interval === 'WEEKLY' && (
                <div className="space-y-2">
                  <Label>Dia de la Semana</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAS_SEMANA.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(interval === 'MONTHLY' || interval === 'YEARLY') && (
                <div className="space-y-2">
                  <Label>Dia del Mes</Label>
                  <Select value={anchorDay} onValueChange={setAnchorDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin (opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Modo de Ejecucion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modo</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO_DRAFT">Crear Borrador</SelectItem>
                    <SelectItem value="AUTO_SEND">Crear y Firmar</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {mode === 'AUTO_DRAFT'
                    ? 'Se creara un borrador que debera firmar manualmente'
                    : 'Se creara y firmara automaticamente'}
                </p>
              </div>
              {mode === 'AUTO_SEND' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoTransmit}
                      onChange={(e) => setAutoTransmit(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Transmitir a Hacienda automaticamente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Al activar, las facturas se enviaran a Hacienda sin intervencion manual
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Items de la Factura</CardTitle>
              <div className="flex items-center gap-2">
                <CatalogSearch onSelect={handleCatalogSelect} />
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-4 w-4" />
                  Agregar Manual
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-1">
                <div className="col-span-5">Descripcion</div>
                <div className="col-span-2">Cantidad</div>
                <div className="col-span-2">Precio Unit.</div>
                <div className="col-span-2">Descuento</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      value={item.descripcion}
                      onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                      placeholder="Descripcion del item"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.cantidad || ''}
                      onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precioUnitario || ''}
                      onChange={(e) => updateItem(index, 'precioUnitario', e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.descuento || ''}
                      onChange={(e) => updateItem(index, 'descuento', e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Total estimado */}
              <div className="flex justify-end border-t pt-3 pr-12">
                <div className="text-sm">
                  <span className="text-muted-foreground mr-2">Subtotal estimado:</span>
                  <span className="font-semibold">${totalEstimado.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas opcionales que se incluiran en cada factura generada"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/facturas/recurrentes">
            <Button type="button" variant="outline">{tCommon('cancel')}</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? tCommon('saving') : tCommon('create')}
          </Button>
        </div>
      </form>
    </div>
  );
}
