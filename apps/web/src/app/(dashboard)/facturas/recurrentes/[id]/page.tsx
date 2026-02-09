'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Pause,
  Play,
  XCircle,
  Zap,
  History,
  Plus,
  Trash2,
} from 'lucide-react';

interface TemplateItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

interface HistoryEntry {
  id: string;
  status: string;
  dteId: string | null;
  error: string | null;
  runDate: string;
  createdAt: string;
}

interface TemplateDetail {
  id: string;
  nombre: string;
  descripcion: string | null;
  clienteId: string;
  tipoDte: string;
  interval: string;
  anchorDay: number | null;
  dayOfWeek: number | null;
  mode: string;
  autoTransmit: boolean;
  items: string;
  notas: string | null;
  status: string;
  consecutiveFailures: number;
  lastError: string | null;
  nextRunDate: string;
  lastRunDate: string | null;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  cliente: {
    id: string;
    nombre: string;
    numDocumento: string;
  };
  history: HistoryEntry[];
  _count: { history: number };
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  SUSPENDED_ERROR: 'Suspendido',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  SUSPENDED_ERROR: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const INTERVAL_LABELS: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
};

const HISTORY_STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  SKIPPED: 'bg-yellow-100 text-yellow-800',
};

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export default function RecurrenteDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;
  const { confirm, ConfirmDialog } = useConfirm();

  const [template, setTemplate] = React.useState<TemplateDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState(false);

  // Editable fields
  const [nombre, setNombre] = React.useState('');
  const [descripcion, setDescripcion] = React.useState('');
  const [mode, setMode] = React.useState('');
  const [autoTransmit, setAutoTransmit] = React.useState(false);
  const [notas, setNotas] = React.useState('');
  const [items, setItems] = React.useState<TemplateItem[]>([]);
  const [endDate, setEndDate] = React.useState('');

  const fetchTemplate = React.useCallback(async () => {
    setFetchError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        if (res.status === 404) {
          setFetchError('Template no encontrado o servicio no disponible.');
          return;
        }
        throw new Error(`Error al cargar template (${res.status})`);
      }
      const data: TemplateDetail = await res.json();
      setTemplate(data);

      // Set editable values
      setNombre(data.nombre);
      setDescripcion(data.descripcion || '');
      setMode(data.mode);
      setAutoTransmit(data.autoTransmit);
      setNotas(data.notas || '');
      setEndDate(data.endDate ? data.endDate.split('T')[0] : '');
      try {
        setItems(JSON.parse(data.items));
      } catch {
        setItems([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar template';
      setFetchError(message);
      toastRef.current.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleAction = async (action: 'pause' | 'resume' | 'cancel' | 'trigger') => {
    if (action === 'cancel') {
      const ok = await confirm({
        title: 'Cancelar Template',
        description: 'Esta accion es irreversible. El template no generara mas facturas.',
        confirmText: 'Cancelar Template',
        variant: 'destructive',
      });
      if (!ok) return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices/${id}/${action}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al ejecutar accion');
      }
      toast.success(`Accion ejecutada`);
      fetchTemplate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const body: Record<string, unknown> = {
        nombre,
        descripcion: descripcion || undefined,
        mode,
        autoTransmit,
        notas: notas || undefined,
        items,
        endDate: endDate || undefined,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recurring-invoices/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al guardar');
      }

      toast.success('Template actualizado');
      setEditing(false);
      fetchTemplate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (fetchError || !template) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Link href="/facturas/recurrentes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Template no disponible</h1>
            <p className="text-muted-foreground mt-1">
              {fetchError || 'No se pudo cargar el template.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <ConfirmDialog />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facturas/recurrentes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{template.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  STATUS_COLORS[template.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {STATUS_LABELS[template.status] || template.status}
              </span>
              <span className="text-sm text-muted-foreground">
                {INTERVAL_LABELS[template.interval]} | {template.cliente.nombre}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {template.status === 'ACTIVE' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleAction('trigger')}>
                <Zap className="mr-1 h-4 w-4" />
                Ejecutar Ahora
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAction('pause')}>
                <Pause className="mr-1 h-4 w-4" />
                Pausar
              </Button>
            </>
          )}
          {(template.status === 'PAUSED' || template.status === 'SUSPENDED_ERROR') && (
            <Button variant="outline" size="sm" onClick={() => handleAction('resume')}>
              <Play className="mr-1 h-4 w-4" />
              Reanudar
            </Button>
          )}
          {template.status !== 'CANCELLED' && (
            <Button variant="destructive" size="sm" onClick={() => handleAction('cancel')}>
              <XCircle className="mr-1 h-4 w-4" />
              Cancelar
            </Button>
          )}
          {!editing && template.status !== 'CANCELLED' && (
            <Button size="sm" onClick={() => setEditing(true)}>Editar</Button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {template.lastError && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">
              Error ({template.consecutiveFailures} fallo{template.consecutiveFailures > 1 ? 's' : ''} consecutivo{template.consecutiveFailures > 1 ? 's' : ''}):
            </p>
            <p className="text-sm text-muted-foreground mt-1">{template.lastError}</p>
          </CardContent>
        </Card>
      )}

      {/* Detail / Edit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuracion</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
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
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Fin (opcional)</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                {mode === 'AUTO_SEND' && (
                  <div className="space-y-2 flex items-end">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={autoTransmit}
                        onChange={(e) => setAutoTransmit(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Transmitir a Hacienda
                    </Label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                  rows={2}
                />
              </div>

              {/* Editable items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-1 h-3 w-3" />
                    Agregar
                  </Button>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        value={item.descripcion}
                        onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                        placeholder="Descripcion"
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
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.descuento || ''}
                        onChange={(e) => updateItem(index, 'descuento', e.target.value)}
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
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => { setEditing(false); fetchTemplate(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-1 h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <p className="font-medium">{template.cliente.nombre}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo DTE:</span>
                <p className="font-medium">{template.tipoDte === '01' ? 'Factura' : 'Credito Fiscal'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Frecuencia:</span>
                <p className="font-medium">
                  {INTERVAL_LABELS[template.interval]}
                  {template.interval === 'WEEKLY' && template.dayOfWeek != null && ` (${DIAS_SEMANA[template.dayOfWeek]})`}
                  {(template.interval === 'MONTHLY' || template.interval === 'YEARLY') && template.anchorDay && ` (dia ${template.anchorDay})`}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Modo:</span>
                <p className="font-medium">
                  {template.mode === 'AUTO_DRAFT' ? 'Crear Borrador' : 'Crear y Firmar'}
                  {template.autoTransmit && ' + Transmitir'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Proxima Ejecucion:</span>
                <p className="font-medium">
                  {template.status === 'ACTIVE' ? formatDate(template.nextRunDate) : '-'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Ultima Ejecucion:</span>
                <p className="font-medium">
                  {template.lastRunDate ? formatDate(template.lastRunDate) : 'Nunca'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Inicio:</span>
                <p className="font-medium">{formatDate(template.startDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fin:</span>
                <p className="font-medium">{template.endDate ? formatDate(template.endDate) : 'Sin fin'}</p>
              </div>
              {template.descripcion && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Descripcion:</span>
                  <p className="font-medium">{template.descripcion}</p>
                </div>
              )}
              {template.notas && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Notas:</span>
                  <p className="font-medium">{template.notas}</p>
                </div>
              )}

              {/* Items table */}
              <div className="col-span-2 mt-2">
                <span className="text-muted-foreground">Items:</span>
                <div className="mt-2 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripcion</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Desc.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        try {
                          const parsedItems: TemplateItem[] = JSON.parse(template.items);
                          return parsedItems.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>{item.descripcion}</TableCell>
                              <TableCell className="text-right">{item.cantidad}</TableCell>
                              <TableCell className="text-right">${item.precioUnitario.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${item.descuento.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium">
                                ${(item.cantidad * item.precioUnitario - item.descuento).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ));
                        } catch {
                          return (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                Error al leer items
                              </TableCell>
                            </TableRow>
                          );
                        }
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial Reciente
            </CardTitle>
            <Link href={`/facturas/recurrentes/${id}/historial`}>
              <Button variant="outline" size="sm">
                Ver Todo ({template._count.history})
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {template.history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No hay ejecuciones registradas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>DTE</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {template.history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm">{formatDate(h.runDate)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          HISTORY_STATUS_COLORS[h.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {h.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {h.dteId ? (
                        <Link
                          href={`/facturas`}
                          className="text-primary hover:underline text-sm"
                        >
                          Ver DTE
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {h.error || '-'}
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
