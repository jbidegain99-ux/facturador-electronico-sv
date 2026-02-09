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
import { Plus, Search, Pencil, Trash2, User, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { PageSizeSelector } from '@/components/ui/page-size-selector';

interface Cliente {
  id: string;
  tipoDocumento: string;
  numDocumento: string;
  nombre: string;
  nrc?: string;
  correo?: string;
  telefono?: string;
  direccion: {
    departamento: string;
    municipio: string;
    complemento: string;
  };
}

interface ClientesResponse {
  data: Cliente[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ClienteForm {
  tipoDocumento: string;
  numDocumento: string;
  nombre: string;
  nrc: string;
  correo: string;
  telefono: string;
  direccion: {
    departamento: string;
    municipio: string;
    complemento: string;
  };
}

const tipoDocumentoLabels: Record<string, string> = {
  '36': 'NIT',
  '13': 'DUI',
  '02': 'Carnet Residente',
  '03': 'Pasaporte',
  '37': 'Otro',
};

const initialFormState: ClienteForm = {
  tipoDocumento: '36',
  numDocumento: '',
  nombre: '',
  nrc: '',
  correo: '',
  telefono: '',
  direccion: { departamento: '06', municipio: '14', complemento: '' },
};

// Validation patterns
const NIT_PATTERN = /^\d{4}-\d{6}-\d{3}-\d{1}$/;
const DUI_PATTERN = /^\d{8}-\d{1}$/;
const NRC_PATTERN = /^\d{1,7}(-\d)?$/;
const PHONE_PATTERN = /^\d{4}-\d{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: string, value: string, formData: ClienteForm): string {
  switch (field) {
    case 'numDocumento': {
      if (!value.trim()) return 'Este campo es requerido';
      const tipo = formData.tipoDocumento;
      if (tipo === '36' && !NIT_PATTERN.test(value)) {
        return 'Formato de NIT invalido (debe ser 0000-000000-000-0)';
      }
      if (tipo === '13' && !DUI_PATTERN.test(value)) {
        return 'Formato de DUI invalido (debe ser 00000000-0)';
      }
      if (tipo === '03' && (value.length < 6 || value.length > 15)) {
        return 'El pasaporte debe tener entre 6 y 15 caracteres';
      }
      return '';
    }
    case 'nombre':
      if (!value.trim()) return 'Este campo es requerido';
      if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
      if (value.trim().length > 200) return 'El nombre no puede exceder 200 caracteres';
      return '';
    case 'nrc':
      if (!value) return '';
      if (!NRC_PATTERN.test(value)) return 'NRC invalido (maximo 7 digitos, formato: 000000-0)';
      return '';
    case 'telefono':
      if (!value) return '';
      if (!PHONE_PATTERN.test(value)) return 'Formato invalido (debe ser 0000-0000)';
      return '';
    case 'correo':
      if (!value) return '';
      if (!EMAIL_PATTERN.test(value)) return 'El correo electronico no es valido';
      return '';
    case 'complemento':
      if (value.length > 500) return 'La direccion no puede exceder 500 caracteres';
      return '';
    default:
      return '';
  }
}

function isFormValid(formData: ClienteForm): boolean {
  if (!formData.numDocumento.trim()) return false;
  if (!formData.nombre.trim() || formData.nombre.trim().length < 3) return false;
  if (validateField('numDocumento', formData.numDocumento, formData)) return false;
  if (formData.nrc && validateField('nrc', formData.nrc, formData)) return false;
  if (formData.telefono && validateField('telefono', formData.telefono, formData)) return false;
  if (formData.correo && validateField('correo', formData.correo, formData)) return false;
  return true;
}

type SortField = 'nombre' | 'numDocumento' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function ClientesPage() {
  const toast = useToast();

  const [search, setSearch] = React.useState('');
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  // Sort state
  const [sortBy, setSortBy] = React.useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCliente, setEditingCliente] = React.useState<Cliente | null>(null);
  const [formData, setFormData] = React.useState<ClienteForm>(initialFormState);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Fetch clientes
  const fetchClientes = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No hay sesion activa');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      if (search) params.set('search', search);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clientes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al cargar clientes (${res.status})`);
      }

      const data = await res.json();
      // Defensive: handle both {data: [...], total, ...} and plain array responses
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const parsedTotal = Number(data?.total);
      const parsedTotalPages = Number(data?.totalPages);
      setClientes(items);
      setTotal(!isNaN(parsedTotal) ? parsedTotal : items.length);
      setTotalPages(!isNaN(parsedTotalPages) && parsedTotalPages >= 1 ? parsedTotalPages : 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit, sortBy, sortOrder]);

  React.useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Debounced search - reset to page 1
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const openCreateModal = () => {
    setEditingCliente(null);
    setFormData(initialFormState);
    setFieldErrors({});
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      tipoDocumento: cliente.tipoDocumento,
      numDocumento: cliente.numDocumento,
      nombre: cliente.nombre,
      nrc: cliente.nrc || '',
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || { departamento: '06', municipio: '14', complemento: '' },
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
    setFormData(initialFormState);
    setFieldErrors({});
    setFormError(null);
  };

  const handleFormChange = (field: keyof ClienteForm, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setFormError(null);
    // Validate changed field
    const error = validateField(field, value, newFormData);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    // Re-validate numDocumento when tipoDocumento changes
    if (field === 'tipoDocumento' && newFormData.numDocumento) {
      const docError = validateField('numDocumento', newFormData.numDocumento, newFormData);
      setFieldErrors(prev => ({ ...prev, numDocumento: docError }));
    }
  };

  const handleDireccionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      direccion: { ...prev.direccion, [field]: value },
    }));
    const error = validateField(field, value, formData);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('No hay sesion activa');
      return;
    }

    // Validate all fields
    const errors: Record<string, string> = {};
    errors.numDocumento = validateField('numDocumento', formData.numDocumento, formData);
    errors.nombre = validateField('nombre', formData.nombre, formData);
    errors.nrc = validateField('nrc', formData.nrc, formData);
    errors.telefono = validateField('telefono', formData.telefono, formData);
    errors.correo = validateField('correo', formData.correo, formData);
    errors.complemento = validateField('complemento', formData.direccion.complemento, formData);

    // Filter out empty errors
    const activeErrors = Object.entries(errors).filter(([, v]) => v);
    if (activeErrors.length > 0) {
      setFieldErrors(errors);
      setFormError('Corrija los errores en el formulario');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const url = editingCliente
        ? `${process.env.NEXT_PUBLIC_API_URL}/clientes/${editingCliente.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/clientes`;

      const res = await fetch(url, {
        method: editingCliente ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar cliente');
      }

      closeModal();
      fetchClientes();
      toast.success(editingCliente ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
    } catch (err) {
      console.error('Error saving cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar cliente';
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar cliente');
      }

      setDeleteConfirm(null);
      fetchClientes();
      toast.success('Cliente eliminado correctamente');
    } catch (err) {
      console.error('Error deleting cliente:', err);
      toast.error(err instanceof Error ? err.message : 'Error al eliminar cliente');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu base de clientes para facturacion rapida
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
          <Button variant="link" className="ml-2 text-red-700" onClick={fetchClientes}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Search + Page Size */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, documento o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <PageSizeSelector value={limit} onChange={handleLimitChange} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <SkeletonTable rows={8} />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => handleSort('nombre')}
                      >
                        Cliente
                        {getSortIcon('nombre')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => handleSort('numDocumento')}
                      >
                        Documento
                        {getSortIcon('numDocumento')}
                      </button>
                    </TableHead>
                    <TableHead>NRC</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!clientes || clientes.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {search ? 'No se encontraron clientes con esa busqueda' : 'No hay clientes registrados. Crea el primero.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{cliente.nombre}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="mb-1">
                              {tipoDocumentoLabels[cliente.tipoDocumento] || cliente.tipoDocumento}
                            </Badge>
                            <div className="font-mono text-sm">{cliente.numDocumento}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cliente.nrc ? (
                            <span className="font-mono text-sm">{cliente.nrc}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {cliente.telefono && <div>{cliente.telefono}</div>}
                            {cliente.correo && (
                              <div className="text-muted-foreground">{cliente.correo}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditModal(cliente)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirm(cliente.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                showing={clientes?.length ?? 0}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {editingCliente
                ? 'Modifica los datos del cliente'
                : 'Completa los datos para registrar un nuevo cliente'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo Documento</label>
                <Select
                  value={formData.tipoDocumento}
                  onValueChange={(value) => handleFormChange('tipoDocumento', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="36">NIT</SelectItem>
                    <SelectItem value="13">DUI</SelectItem>
                    <SelectItem value="02">Carnet Residente</SelectItem>
                    <SelectItem value="03">Pasaporte</SelectItem>
                    <SelectItem value="37">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Numero Documento *</label>
                <Input
                  placeholder={formData.tipoDocumento === '36' ? '0000-000000-000-0' : formData.tipoDocumento === '13' ? '00000000-0' : 'Numero de documento'}
                  value={formData.numDocumento}
                  onChange={(e) => handleFormChange('numDocumento', e.target.value)}
                  className={fieldErrors.numDocumento ? 'border-red-500' : ''}
                />
                {fieldErrors.numDocumento && (
                  <p className="text-xs text-red-500">{fieldErrors.numDocumento}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre / Razon Social *</label>
              <Input
                placeholder="Nombre del cliente"
                value={formData.nombre}
                onChange={(e) => handleFormChange('nombre', e.target.value)}
                className={fieldErrors.nombre ? 'border-red-500' : ''}
              />
              {fieldErrors.nombre && (
                <p className="text-xs text-red-500">{fieldErrors.nombre}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">NRC</label>
                <Input
                  placeholder="000000-0"
                  value={formData.nrc}
                  onChange={(e) => handleFormChange('nrc', e.target.value)}
                  className={fieldErrors.nrc ? 'border-red-500' : ''}
                />
                {fieldErrors.nrc && (
                  <p className="text-xs text-red-500">{fieldErrors.nrc}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Telefono</label>
                <Input
                  placeholder="0000-0000"
                  value={formData.telefono}
                  onChange={(e) => handleFormChange('telefono', e.target.value)}
                  className={fieldErrors.telefono ? 'border-red-500' : ''}
                />
                {fieldErrors.telefono && (
                  <p className="text-xs text-red-500">{fieldErrors.telefono}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Correo Electronico</label>
              <Input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={formData.correo}
                onChange={(e) => handleFormChange('correo', e.target.value)}
                className={fieldErrors.correo ? 'border-red-500' : ''}
              />
              {fieldErrors.correo && (
                <p className="text-xs text-red-500">{fieldErrors.correo}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Direccion</label>
              <Input
                placeholder="Direccion completa"
                value={formData.direccion.complemento}
                onChange={(e) => handleDireccionChange('complemento', e.target.value)}
                className={fieldErrors.complemento ? 'border-red-500' : ''}
              />
              {fieldErrors.complemento && (
                <p className="text-xs text-red-500">{fieldErrors.complemento}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !isFormValid(formData)}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingCliente ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Cliente'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar Cliente</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que deseas eliminar este cliente? Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
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
