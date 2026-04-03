'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  MapPin,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Store,
} from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────
interface PuntoVenta {
  id: string;
  sucursalId: string;
  nombre: string;
  codPuntoVentaMH: string;
  codPuntoVenta: string;
  activo: boolean;
}

interface Sucursal {
  id: string;
  tenantId: string;
  nombre: string;
  codEstableMH: string;
  codEstable: string;
  tipoEstablecimiento: string;
  direccion: string;
  departamento: string;
  municipio: string;
  telefono: string | null;
  correo: string | null;
  esPrincipal: boolean;
  activa: boolean;
  puntosVenta?: PuntoVenta[];
}

interface SucursalForm {
  nombre: string;
  codEstableMH: string;
  codEstable: string;
  tipoEstablecimiento: string;
  direccion: string;
  departamento: string;
  municipio: string;
  telefono: string;
  correo: string;
  esPrincipal: boolean;
}

interface PuntoVentaForm {
  nombre: string;
  codPuntoVentaMH: string;
  codPuntoVenta: string;
}

const initialSucursalForm: SucursalForm = {
  nombre: '',
  codEstableMH: '',
  codEstable: '',
  tipoEstablecimiento: '02',
  direccion: '',
  departamento: '06',
  municipio: '14',
  telefono: '',
  correo: '',
  esPrincipal: false,
};

const initialPvForm: PuntoVentaForm = {
  nombre: '',
  codPuntoVentaMH: '',
  codPuntoVenta: '',
};

const TIPO_ESTABLECIMIENTO: Record<string, string> = {
  '01': 'Sucursal / Agencia',
  '02': 'Casa Matriz',
  '04': 'Bodega',
  '07': 'Centro de Distribucion',
  '20': 'Otro',
};

const DEPARTAMENTOS: Record<string, string> = {
  '01': 'Ahuachapan',
  '02': 'Santa Ana',
  '03': 'Sonsonate',
  '04': 'Chalatenango',
  '05': 'La Libertad',
  '06': 'San Salvador',
  '07': 'Cuscatlan',
  '08': 'La Paz',
  '09': 'Cabanas',
  '10': 'San Vicente',
  '11': 'Usulutan',
  '12': 'San Miguel',
  '13': 'Morazan',
  '14': 'La Union',
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

// ── Component ────────────────────────────────────────────────────────
export default function SucursalesPage() {
  const toast = useToast();
  const router = useRouter();

  // Data state
  const [sucursales, setSucursales] = React.useState<Sucursal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sucursal modal
  const [isSucursalModalOpen, setIsSucursalModalOpen] = React.useState(false);
  const [editingSucursal, setEditingSucursal] = React.useState<Sucursal | null>(null);
  const [sucursalForm, setSucursalForm] = React.useState<SucursalForm>(initialSucursalForm);
  const [savingSucursal, setSavingSucursal] = React.useState(false);
  const [sucursalFormError, setSucursalFormError] = React.useState<string | null>(null);

  // PV modal
  const [isPvModalOpen, setIsPvModalOpen] = React.useState(false);
  const [editingPv, setEditingPv] = React.useState<PuntoVenta | null>(null);
  const [pvParentId, setPvParentId] = React.useState<string | null>(null);
  const [pvForm, setPvForm] = React.useState<PuntoVentaForm>(initialPvForm);
  const [savingPv, setSavingPv] = React.useState(false);
  const [pvFormError, setPvFormError] = React.useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = React.useState<{ type: 'sucursal' | 'pv'; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Expanded sucursales (to show puntos de venta)
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  // ── Fetch sucursales ───────────────────────────────────────────────
  const fetchSucursales = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Sucursal[]>('/sucursales');
      const items = Array.isArray(data) ? data : [];
      setSucursales(items);
      setError(null);
    } catch (err) {
      console.error('Error fetching sucursales:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar sucursales');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSucursales();
  }, [fetchSucursales]);

  // ── Fetch puntos de venta for a sucursal ───────────────────────────
  const fetchPuntosVenta = async (sucursalId: string) => {
    try {
      const pvs = await apiFetch<PuntoVenta[]>(`/sucursales/${sucursalId}/puntos-venta`);
      setSucursales(prev =>
        prev.map(s =>
          s.id === sucursalId ? { ...s, puntosVenta: Array.isArray(pvs) ? pvs : [] } : s
        )
      );
    } catch {
      // Non-critical
    }
  };

  const toggleExpand = (sucursalId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(sucursalId)) {
        next.delete(sucursalId);
      } else {
        next.add(sucursalId);
        // Fetch PVs if not loaded
        const suc = sucursales.find(s => s.id === sucursalId);
        if (suc && !suc.puntosVenta) {
          fetchPuntosVenta(sucursalId);
        }
      }
      return next;
    });
  };

  // ── Sucursal CRUD ──────────────────────────────────────────────────
  const openCreateSucursal = () => {
    setEditingSucursal(null);
    setSucursalForm(initialSucursalForm);
    setSucursalFormError(null);
    setIsSucursalModalOpen(true);
  };

  const openEditSucursal = (suc: Sucursal) => {
    setEditingSucursal(suc);
    setSucursalForm({
      nombre: suc.nombre,
      codEstableMH: suc.codEstableMH,
      codEstable: suc.codEstable,
      tipoEstablecimiento: suc.tipoEstablecimiento,
      direccion: suc.direccion,
      departamento: suc.departamento,
      municipio: suc.municipio,
      telefono: suc.telefono || '',
      correo: suc.correo || '',
      esPrincipal: suc.esPrincipal,
    });
    setSucursalFormError(null);
    setIsSucursalModalOpen(true);
  };

  const closeSucursalModal = () => {
    setIsSucursalModalOpen(false);
    setEditingSucursal(null);
    setSucursalForm(initialSucursalForm);
    setSucursalFormError(null);
  };

  const isSucursalFormValid = (): boolean => {
    return !!(sucursalForm.nombre.trim() && sucursalForm.codEstableMH.trim() && sucursalForm.direccion.trim());
  };

  const handleSaveSucursal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSucursalFormValid()) return;

    setSavingSucursal(true);
    setSucursalFormError(null);

    try {
      const endpoint = editingSucursal
        ? `/sucursales/${editingSucursal.id}`
        : `/sucursales`;

      await apiFetch(endpoint, {
        method: editingSucursal ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...sucursalForm,
          codEstable: sucursalForm.codEstable || sucursalForm.codEstableMH,
          telefono: sucursalForm.telefono || undefined,
          correo: sucursalForm.correo || undefined,
        }),
      });

      closeSucursalModal();
      fetchSucursales();
      toast.success(editingSucursal ? 'Sucursal actualizada' : 'Sucursal creada');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setSucursalFormError(msg);
      toast.error(msg);
    } finally {
      setSavingSucursal(false);
    }
  };

  // ── Punto de Venta CRUD ────────────────────────────────────────────
  const openCreatePv = (sucursalId: string) => {
    setEditingPv(null);
    setPvParentId(sucursalId);
    setPvForm(initialPvForm);
    setPvFormError(null);
    setIsPvModalOpen(true);
  };

  const openEditPv = (pv: PuntoVenta) => {
    setEditingPv(pv);
    setPvParentId(pv.sucursalId);
    setPvForm({
      nombre: pv.nombre,
      codPuntoVentaMH: pv.codPuntoVentaMH,
      codPuntoVenta: pv.codPuntoVenta,
    });
    setPvFormError(null);
    setIsPvModalOpen(true);
  };

  const closePvModal = () => {
    setIsPvModalOpen(false);
    setEditingPv(null);
    setPvParentId(null);
    setPvForm(initialPvForm);
    setPvFormError(null);
  };

  const isPvFormValid = (): boolean => {
    return !!(pvForm.nombre.trim() && pvForm.codPuntoVentaMH.trim());
  };

  const handleSavePv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPvFormValid()) return;

    setSavingPv(true);
    setPvFormError(null);

    try {
      const endpoint = editingPv
        ? `/sucursales/puntos-venta/${editingPv.id}`
        : `/sucursales/${pvParentId}/puntos-venta`;

      await apiFetch(endpoint, {
        method: editingPv ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...pvForm,
          codPuntoVenta: pvForm.codPuntoVenta || pvForm.codPuntoVentaMH,
        }),
      });

      closePvModal();
      if (pvParentId) fetchPuntosVenta(pvParentId);
      toast.success(editingPv ? 'Punto de venta actualizado' : 'Punto de venta creado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setPvFormError(msg);
      toast.error(msg);
    } finally {
      setSavingPv(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const endpoint = deleteTarget.type === 'sucursal'
        ? `/sucursales/${deleteTarget.id}`
        : `/sucursales/puntos-venta/${deleteTarget.id}`;

      await apiFetch(endpoint, { method: 'DELETE' });

      setDeleteTarget(null);
      fetchSucursales();
      toast.success(`${deleteTarget.type === 'sucursal' ? 'Sucursal' : 'Punto de venta'} eliminado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/configuracion')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Configuracion
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary" />
              Sucursales y Puntos de Venta
            </h1>
            <p className="text-muted-foreground">
              Administra las sucursales y puntos de venta de tu empresa
            </p>
          </div>
        </div>
        <Button onClick={openCreateSucursal}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sucursal
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
          <Button variant="link" className="ml-2 text-red-700" onClick={fetchSucursales}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <SkeletonTable rows={4} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Codigo MH</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicacion</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sucursales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No hay sucursales registradas</p>
                      <p className="text-sm mt-1">Crea tu primera sucursal para comenzar</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sucursales.map((suc) => (
                    <React.Fragment key={suc.id}>
                      {/* Sucursal row */}
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(suc.id)}>
                        <TableCell>
                          <button className="p-1 rounded hover:bg-muted">
                            {expanded.has(suc.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{suc.nombre}</div>
                              {suc.esPrincipal && (
                                <Badge variant="info" className="text-[10px] mt-0.5">Principal</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{suc.codEstableMH}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{TIPO_ESTABLECIMIENTO[suc.tipoEstablecimiento] || suc.tipoEstablecimiento}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{DEPARTAMENTOS[suc.departamento] || suc.departamento}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={suc.activa ? 'success' : 'secondary'}>
                            {suc.activa ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openCreatePv(suc.id)}
                              title="Agregar punto de venta"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditSucursal(suc)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {!suc.esPrincipal && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({ type: 'sucursal', id: suc.id, name: suc.nombre })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Puntos de venta (expanded) */}
                      {expanded.has(suc.id) && (
                        <>
                          {!suc.puntosVenta ? (
                            <TableRow>
                              <TableCell colSpan={7} className="py-3 pl-16 text-muted-foreground text-sm">
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                Cargando puntos de venta...
                              </TableCell>
                            </TableRow>
                          ) : suc.puntosVenta.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="py-3 pl-16 text-muted-foreground text-sm">
                                Sin puntos de venta.{' '}
                                <button
                                  className="text-primary hover:underline"
                                  onClick={() => openCreatePv(suc.id)}
                                >
                                  Crear uno
                                </button>
                              </TableCell>
                            </TableRow>
                          ) : (
                            suc.puntosVenta.map((pv) => (
                              <TableRow key={pv.id} className="bg-muted/30">
                                <TableCell></TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3 pl-6">
                                    <Store className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{pv.nombre}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono text-sm">{pv.codPuntoVentaMH}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">Punto de Venta</span>
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell>
                                  <Badge variant={pv.activo ? 'success' : 'secondary'} className="text-[10px]">
                                    {pv.activo ? 'Activo' : 'Inactivo'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => openEditPv(pv)}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => setDeleteTarget({ type: 'pv', id: pv.id, name: pv.nombre })}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Sucursal Modal ──────────────────────────────────────────── */}
      <Dialog open={isSucursalModalOpen} onOpenChange={setIsSucursalModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </DialogTitle>
            <DialogDescription>
              {editingSucursal
                ? 'Modifica los datos de la sucursal'
                : 'Registra una nueva sucursal para tu empresa'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSucursal} className="space-y-4">
            {sucursalFormError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded text-sm">
                {sucursalFormError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                placeholder="Casa Matriz, Sucursal Centro, etc."
                value={sucursalForm.nombre}
                onChange={(e) => setSucursalForm(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Codigo Establecimiento MH *</label>
                <Input
                  placeholder="M001"
                  value={sucursalForm.codEstableMH}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().slice(0, 4);
                    setSucursalForm(prev => ({ ...prev, codEstableMH: val, codEstable: val }));
                  }}
                  maxLength={4}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tipo Establecimiento</label>
                <Select
                  value={sucursalForm.tipoEstablecimiento}
                  onValueChange={(v) => setSucursalForm(prev => ({ ...prev, tipoEstablecimiento: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_ESTABLECIMIENTO).map(([code, label]) => (
                      <SelectItem key={code} value={code}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Dirección *</label>
              <Input
                placeholder="Dirección completa de la sucursal"
                value={sucursalForm.direccion}
                onChange={(e) => setSucursalForm(prev => ({ ...prev, direccion: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Departamento</label>
                <Select
                  value={sucursalForm.departamento}
                  onValueChange={(v) => setSucursalForm(prev => ({ ...prev, departamento: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEPARTAMENTOS).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Municipio</label>
                <Input
                  placeholder="Código municipio"
                  value={sucursalForm.municipio}
                  onChange={(e) => setSucursalForm(prev => ({ ...prev, municipio: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                  maxLength={2}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  placeholder="0000-0000"
                  value={sucursalForm.telefono}
                  onChange={(e) => setSucursalForm(prev => ({ ...prev, telefono: formatPhone(e.target.value) }))}
                  maxLength={9}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Correo</label>
                <Input
                  type="email"
                  placeholder="sucursal@empresa.com"
                  value={sucursalForm.correo}
                  onChange={(e) => setSucursalForm(prev => ({ ...prev, correo: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esPrincipal"
                checked={sucursalForm.esPrincipal}
                onChange={(e) => setSucursalForm(prev => ({ ...prev, esPrincipal: e.target.checked }))}
                className="rounded border-input"
              />
              <label htmlFor="esPrincipal" className="text-sm">
                Es la sucursal principal (Casa Matriz)
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeSucursalModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingSucursal || !isSucursalFormValid()}>
                {savingSucursal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingSucursal ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Sucursal'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Punto de Venta Modal ────────────────────────────────────── */}
      <Dialog open={isPvModalOpen} onOpenChange={setIsPvModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {editingPv ? 'Editar Punto de Venta' : 'Nuevo Punto de Venta'}
            </DialogTitle>
            <DialogDescription>
              {editingPv
                ? 'Modifica los datos del punto de venta'
                : 'Agrega un punto de venta a la sucursal'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePv} className="space-y-4">
            {pvFormError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded text-sm">
                {pvFormError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                placeholder="Punto de Venta Principal, Caja 1, etc."
                value={pvForm.nombre}
                onChange={(e) => setPvForm(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Codigo MH *</label>
                <Input
                  placeholder="P001"
                  value={pvForm.codPuntoVentaMH}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().slice(0, 4);
                    setPvForm(prev => ({ ...prev, codPuntoVentaMH: val, codPuntoVenta: val }));
                  }}
                  maxLength={4}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Codigo Interno</label>
                <Input
                  placeholder="P001"
                  value={pvForm.codPuntoVenta}
                  onChange={(e) => setPvForm(prev => ({ ...prev, codPuntoVenta: e.target.value.toUpperCase().slice(0, 4) }))}
                  maxLength={4}
                  className="font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePvModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingPv || !isPvFormValid()}>
                {savingPv ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingPv ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Punto de Venta'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminacion</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  Estas seguro de eliminar {deleteTarget.type === 'sucursal' ? 'la sucursal' : 'el punto de venta'}{' '}
                  <strong>{deleteTarget.name}</strong>? Esta accion no se puede deshacer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
