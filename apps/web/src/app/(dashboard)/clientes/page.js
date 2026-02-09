'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ClientesPage;
const React = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const table_1 = require("@/components/ui/table");
const badge_1 = require("@/components/ui/badge");
const dialog_1 = require("@/components/ui/dialog");
const select_1 = require("@/components/ui/select");
const lucide_react_1 = require("lucide-react");
const skeleton_1 = require("@/components/ui/skeleton");
const toast_1 = require("@/components/ui/toast");
const pagination_1 = require("@/components/ui/pagination");
const page_size_selector_1 = require("@/components/ui/page-size-selector");
const tipoDocumentoLabels = {
    '36': 'NIT',
    '13': 'DUI',
    '02': 'Carnet Residente',
    '03': 'Pasaporte',
    '37': 'Otro',
};
const initialFormState = {
    tipoDocumento: '36',
    numDocumento: '',
    nombre: '',
    nrc: '',
    correo: '',
    telefono: '',
    direccion: { departamento: '06', municipio: '14', complemento: '' },
};
function ClientesPage() {
    const toast = (0, toast_1.useToast)();
    const [search, setSearch] = React.useState('');
    const [clientes, setClientes] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    // Pagination state
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(20);
    const [total, setTotal] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(1);
    // Sort state
    const [sortBy, setSortBy] = React.useState('createdAt');
    const [sortOrder, setSortOrder] = React.useState('desc');
    // Modal state
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingCliente, setEditingCliente] = React.useState(null);
    const [formData, setFormData] = React.useState(initialFormState);
    const [saving, setSaving] = React.useState(false);
    const [formError, setFormError] = React.useState(null);
    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = React.useState(null);
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
            if (search)
                params.set('search', search);
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
        }
        catch (err) {
            console.error('Error fetching clientes:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar clientes');
        }
        finally {
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
    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setPage(1);
    };
    const getSortIcon = (field) => {
        if (sortBy !== field)
            return <lucide_react_1.ArrowUpDown className="h-3 w-3 ml-1 opacity-50"/>;
        return sortOrder === 'asc'
            ? <lucide_react_1.ArrowUp className="h-3 w-3 ml-1"/>
            : <lucide_react_1.ArrowDown className="h-3 w-3 ml-1"/>;
    };
    const openCreateModal = () => {
        setEditingCliente(null);
        setFormData(initialFormState);
        setFormError(null);
        setIsModalOpen(true);
    };
    const openEditModal = (cliente) => {
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
    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFormError(null);
    };
    const handleDireccionChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            direccion: { ...prev.direccion, [field]: value },
        }));
    };
    const handleSubmit = async (e) => {
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
        }
        catch (err) {
            console.error('Error saving cliente:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error al guardar cliente';
            setFormError(errorMessage);
            toast.error(errorMessage);
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        if (!token)
            return;
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
        }
        catch (err) {
            console.error('Error deleting cliente:', err);
            toast.error(err instanceof Error ? err.message : 'Error al eliminar cliente');
        }
        finally {
            setDeleting(false);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu base de clientes para facturacion rapida
          </p>
        </div>
        <button_1.Button onClick={openCreateModal}>
          <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
          Nuevo Cliente
        </button_1.Button>
      </div>

      {/* Error Message */}
      {error && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
          <button_1.Button variant="link" className="ml-2 text-red-700" onClick={fetchClientes}>
            Reintentar
          </button_1.Button>
        </div>)}

      {/* Search + Page Size */}
      <card_1.Card>
        <card_1.CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <input_1.Input placeholder="Buscar por nombre, documento o correo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9"/>
            </div>
            <page_size_selector_1.PageSizeSelector value={limit} onChange={handleLimitChange}/>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Table */}
      <card_1.Card>
        <card_1.CardContent className="p-0">
          {loading ? (<div className="p-4">
              <skeleton_1.SkeletonTable rows={8}/>
            </div>) : (<>
              <table_1.Table>
                <table_1.TableHeader>
                  <table_1.TableRow>
                    <table_1.TableHead>
                      <button className="flex items-center hover:text-foreground transition-colors" onClick={() => handleSort('nombre')}>
                        Cliente
                        {getSortIcon('nombre')}
                      </button>
                    </table_1.TableHead>
                    <table_1.TableHead>
                      <button className="flex items-center hover:text-foreground transition-colors" onClick={() => handleSort('numDocumento')}>
                        Documento
                        {getSortIcon('numDocumento')}
                      </button>
                    </table_1.TableHead>
                    <table_1.TableHead>NRC</table_1.TableHead>
                    <table_1.TableHead>Contacto</table_1.TableHead>
                    <table_1.TableHead className="text-right">Acciones</table_1.TableHead>
                  </table_1.TableRow>
                </table_1.TableHeader>
                <table_1.TableBody>
                  {(!clientes || clientes.length === 0) ? (<table_1.TableRow>
                      <table_1.TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {search ? 'No se encontraron clientes con esa busqueda' : 'No hay clientes registrados. Crea el primero.'}
                      </table_1.TableCell>
                    </table_1.TableRow>) : (clientes.map((cliente) => (<table_1.TableRow key={cliente.id}>
                        <table_1.TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <lucide_react_1.User className="h-5 w-5 text-primary"/>
                            </div>
                            <div>
                              <div className="font-medium">{cliente.nombre}</div>
                            </div>
                          </div>
                        </table_1.TableCell>
                        <table_1.TableCell>
                          <div>
                            <badge_1.Badge variant="outline" className="mb-1">
                              {tipoDocumentoLabels[cliente.tipoDocumento] || cliente.tipoDocumento}
                            </badge_1.Badge>
                            <div className="font-mono text-sm">{cliente.numDocumento}</div>
                          </div>
                        </table_1.TableCell>
                        <table_1.TableCell>
                          {cliente.nrc ? (<span className="font-mono text-sm">{cliente.nrc}</span>) : (<span className="text-muted-foreground">-</span>)}
                        </table_1.TableCell>
                        <table_1.TableCell>
                          <div className="text-sm">
                            {cliente.telefono && <div>{cliente.telefono}</div>}
                            {cliente.correo && (<div className="text-muted-foreground">{cliente.correo}</div>)}
                          </div>
                        </table_1.TableCell>
                        <table_1.TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <button_1.Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(cliente)}>
                              <lucide_react_1.Pencil className="h-4 w-4"/>
                            </button_1.Button>
                            <button_1.Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(cliente.id)}>
                              <lucide_react_1.Trash2 className="h-4 w-4"/>
                            </button_1.Button>
                          </div>
                        </table_1.TableCell>
                      </table_1.TableRow>)))}
                </table_1.TableBody>
              </table_1.Table>

              {/* Pagination */}
              <pagination_1.Pagination page={page} totalPages={totalPages} total={total} showing={clientes?.length ?? 0} onPageChange={setPage}/>
            </>)}
        </card_1.CardContent>
      </card_1.Card>

      {/* Create/Edit Modal */}
      <dialog_1.Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <dialog_1.DialogContent className="sm:max-w-[500px]">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>
              {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </dialog_1.DialogTitle>
            <dialog_1.DialogDescription>
              {editingCliente
            ? 'Modifica los datos del cliente'
            : 'Completa los datos para registrar un nuevo cliente'}
            </dialog_1.DialogDescription>
          </dialog_1.DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded text-sm">
                {formError}
              </div>)}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo Documento</label>
                <select_1.Select value={formData.tipoDocumento} onValueChange={(value) => handleFormChange('tipoDocumento', value)}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue />
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="36">NIT</select_1.SelectItem>
                    <select_1.SelectItem value="13">DUI</select_1.SelectItem>
                    <select_1.SelectItem value="02">Carnet Residente</select_1.SelectItem>
                    <select_1.SelectItem value="03">Pasaporte</select_1.SelectItem>
                    <select_1.SelectItem value="37">Otro</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Numero Documento *</label>
                <input_1.Input placeholder="0000-000000-000-0" value={formData.numDocumento} onChange={(e) => handleFormChange('numDocumento', e.target.value)}/>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre / Razon Social *</label>
              <input_1.Input placeholder="Nombre del cliente" value={formData.nombre} onChange={(e) => handleFormChange('nombre', e.target.value)}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">NRC</label>
                <input_1.Input placeholder="0000000" value={formData.nrc} onChange={(e) => handleFormChange('nrc', e.target.value)}/>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefono</label>
                <input_1.Input placeholder="0000-0000" value={formData.telefono} onChange={(e) => handleFormChange('telefono', e.target.value)}/>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Correo Electronico</label>
              <input_1.Input type="email" placeholder="cliente@ejemplo.com" value={formData.correo} onChange={(e) => handleFormChange('correo', e.target.value)}/>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Direccion</label>
              <input_1.Input placeholder="Direccion completa" value={formData.direccion.complemento} onChange={(e) => handleDireccionChange('complemento', e.target.value)}/>
            </div>

            <dialog_1.DialogFooter>
              <button_1.Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </button_1.Button>
              <button_1.Button type="submit" disabled={saving}>
                {saving ? (<>
                    <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Guardando...
                  </>) : editingCliente ? ('Guardar Cambios') : ('Crear Cliente')}
              </button_1.Button>
            </dialog_1.DialogFooter>
          </form>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* Delete Confirmation Dialog */}
      <dialog_1.Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <dialog_1.DialogContent className="sm:max-w-[400px]">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>Eliminar Cliente</dialog_1.DialogTitle>
            <dialog_1.DialogDescription>
              ¿Estas seguro de que deseas eliminar este cliente? Esta accion no se puede deshacer.
            </dialog_1.DialogDescription>
          </dialog_1.DialogHeader>
          <dialog_1.DialogFooter>
            <button_1.Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </button_1.Button>
            <button_1.Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deleting}>
              {deleting ? (<>
                  <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Eliminando...
                </>) : ('Eliminar')}
            </button_1.Button>
          </dialog_1.DialogFooter>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>
    </div>);
}
