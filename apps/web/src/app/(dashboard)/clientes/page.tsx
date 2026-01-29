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
import { Plus, Search, Pencil, Trash2, User, Loader2, X } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

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

export default function ClientesPage() {
  const toast = useToast();

  const [search, setSearch] = React.useState('');
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCliente, setEditingCliente] = React.useState<Cliente | null>(null);
  const [formData, setFormData] = React.useState<ClienteForm>(initialFormState);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Fetch clientes on mount
  const fetchClientes = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No hay sesion activa');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes${searchParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al cargar clientes');
      }

      const data = await res.json();
      setClientes(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchClientes();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchClientes]);

  const openCreateModal = () => {
    setEditingCliente(null);
    setFormData(initialFormState);
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
    setFormError(null);
  };

  const handleFormChange = (field: keyof ClienteForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleDireccionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      direccion: { ...prev.direccion, [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('No hay sesion activa');
      return;
    }

    // Validation
    if (!formData.numDocumento.trim()) {
      setFormError('El numero de documento es requerido');
      return;
    }
    if (!formData.nombre.trim()) {
      setFormError('El nombre es requerido');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const url = editingCliente
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/${editingCliente.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes`;

      const res = await fetch(url, {
        method: editingCliente ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, documento o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>NRC</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.length === 0 ? (
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
                <Label>Tipo Documento</Label>
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
              <div className="space-y-2">
                <Label>Numero Documento *</Label>
                <Input
                  placeholder="0000-000000-000-0"
                  value={formData.numDocumento}
                  onChange={(e) => handleFormChange('numDocumento', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre / Razon Social *</Label>
              <Input
                placeholder="Nombre del cliente"
                value={formData.nombre}
                onChange={(e) => handleFormChange('nombre', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NRC</Label>
                <Input
                  placeholder="0000000"
                  value={formData.nrc}
                  onChange={(e) => handleFormChange('nrc', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input
                  placeholder="0000-0000"
                  value={formData.telefono}
                  onChange={(e) => handleFormChange('telefono', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Correo Electronico</Label>
              <Input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={formData.correo}
                onChange={(e) => handleFormChange('correo', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Direccion</Label>
              <Input
                placeholder="Direccion completa"
                value={formData.direccion.complemento}
                onChange={(e) => handleDireccionChange('complemento', e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
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
