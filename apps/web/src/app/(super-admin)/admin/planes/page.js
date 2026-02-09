'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PlanesPage;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const dialog_1 = require("@/components/ui/dialog");
const label_1 = require("@/components/ui/label");
const switch_1 = require("@/components/ui/switch");
const initialForm = {
    codigo: '',
    nombre: '',
    descripcion: '',
    maxDtesPerMonth: 100,
    maxUsers: 1,
    maxClientes: 100,
    maxStorageMb: 500,
    features: '',
    precioMensual: null,
    precioAnual: null,
    orden: 0,
    isDefault: false,
    isActive: true,
};
function PlanesPage() {
    const [plans, setPlans] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [seeding, setSeeding] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    // Modal state
    const [showModal, setShowModal] = (0, react_1.useState)(false);
    const [editingPlan, setEditingPlan] = (0, react_1.useState)(null);
    const [form, setForm] = (0, react_1.useState)(initialForm);
    const [saving, setSaving] = (0, react_1.useState)(false);
    // Delete confirmation
    const [deletingPlan, setDeletingPlan] = (0, react_1.useState)(null);
    const [deleting, setDeleting] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        fetchPlans();
    }, []);
    const fetchPlans = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error('Error al cargar planes');
            const data = await res.json();
            setPlans(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSeed = async () => {
        try {
            setSeeding(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans/seed`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error('Error al crear planes');
            alert('Planes creados correctamente');
            fetchPlans();
        }
        catch (err) {
            alert('Error al crear planes');
        }
        finally {
            setSeeding(false);
        }
    };
    const openCreateModal = () => {
        setEditingPlan(null);
        setForm(initialForm);
        setShowModal(true);
    };
    const openEditModal = (plan) => {
        setEditingPlan(plan);
        setForm({
            codigo: plan.codigo,
            nombre: plan.nombre,
            descripcion: plan.descripcion || '',
            maxDtesPerMonth: plan.maxDtesPerMonth,
            maxUsers: plan.maxUsers,
            maxClientes: plan.maxClientes,
            maxStorageMb: plan.maxStorageMb,
            features: plan.features || '',
            precioMensual: plan.precioMensual,
            precioAnual: plan.precioAnual,
            orden: plan.orden,
            isDefault: plan.isDefault,
            isActive: plan.isActive,
        });
        setShowModal(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const url = editingPlan
                ? `${process.env.NEXT_PUBLIC_API_URL}/admin/plans/${editingPlan.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/admin/plans`;
            const res = await fetch(url, {
                method: editingPlan ? 'PUT' : 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Error al guardar plan');
            }
            setShowModal(false);
            fetchPlans();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Error al guardar plan');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!deletingPlan)
            return;
        try {
            setDeleting(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/plans/${deletingPlan.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Error al eliminar plan');
            }
            setDeletingPlan(null);
            fetchPlans();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Error al eliminar plan');
        }
        finally {
            setDeleting(false);
        }
    };
    const formatLimit = (value) => {
        if (value === null || value === undefined)
            return '-';
        const numValue = Number(value);
        if (isNaN(numValue))
            return '-';
        return numValue === -1 ? <lucide_react_1.Infinity className="w-4 h-4 inline"/> : numValue.toLocaleString();
    };
    const formatPrice = (value) => {
        if (value === null || value === undefined)
            return '-';
        const numValue = Number(value);
        if (isNaN(numValue))
            return '-';
        return `$${numValue.toFixed(2)}`;
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los planes y límites para los tenants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button_1.Button variant="outline" onClick={handleSeed} disabled={seeding}>
            <lucide_react_1.Database className="w-4 h-4 mr-2"/>
            Inicializar Planes
          </button_1.Button>
          <button_1.Button onClick={openCreateModal}>
            <lucide_react_1.Plus className="w-4 h-4 mr-2"/>
            Nuevo Plan
          </button_1.Button>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (<div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
        </div>) : error ? (<div className="glass-card p-6 text-center">
          <lucide_react_1.AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
          <p className="text-red-400">{error}</p>
        </div>) : plans.length === 0 ? (<div className="glass-card p-12 text-center">
          <lucide_react_1.CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4"/>
          <h3 className="text-lg font-medium text-white mb-2">Sin planes</h3>
          <p className="text-muted-foreground mb-6">
            No hay planes configurados. Haz clic en "Inicializar Planes" para crear los planes por defecto.
          </p>
          <button_1.Button onClick={handleSeed} disabled={seeding}>
            <lucide_react_1.Database className="w-4 h-4 mr-2"/>
            Inicializar Planes
          </button_1.Button>
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (<div key={plan.id} className={`glass-card p-5 relative ${!plan.isActive ? 'opacity-60' : ''}`}>
              {/* Default badge */}
              {plan.isDefault && (<div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <lucide_react_1.Star className="w-3 h-3"/>
                  Default
                </div>)}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-primary">{plan.codigo}</span>
                  <h3 className="text-lg font-semibold text-white mt-1">{plan.nombre}</h3>
                </div>
                <div className="flex items-center gap-1">
                  {plan.isActive ? (<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      Activo
                    </span>) : (<span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                      Inactivo
                    </span>)}
                </div>
              </div>

              {plan.descripcion && (<p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {plan.descripcion}
                </p>)}

              {/* Limits */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <lucide_react_1.FileText className="w-4 h-4 text-muted-foreground"/>
                  <span className="text-muted-foreground">DTEs/mes:</span>
                  <span className="text-white font-medium">{formatLimit(plan.maxDtesPerMonth)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <lucide_react_1.Users className="w-4 h-4 text-muted-foreground"/>
                  <span className="text-muted-foreground">Usuarios:</span>
                  <span className="text-white font-medium">{formatLimit(plan.maxUsers)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <lucide_react_1.Database className="w-4 h-4 text-muted-foreground"/>
                  <span className="text-muted-foreground">Clientes:</span>
                  <span className="text-white font-medium">{formatLimit(plan.maxClientes)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <lucide_react_1.HardDrive className="w-4 h-4 text-muted-foreground"/>
                  <span className="text-muted-foreground">Storage:</span>
                  <span className="text-white font-medium">
                    {plan.maxStorageMb === -1 ? (<lucide_react_1.Infinity className="w-4 h-4 inline"/>) : (`${plan.maxStorageMb} MB`)}
                  </span>
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-center gap-4 text-sm mb-4 pb-4 border-b border-border">
                <div>
                  <span className="text-muted-foreground">Mensual: </span>
                  <span className="text-white font-medium">{formatPrice(plan.precioMensual)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Anual: </span>
                  <span className="text-white font-medium">{formatPrice(plan.precioAnual)}</span>
                </div>
              </div>

              {/* Tenants count */}
              <div className="flex items-center justify-between text-sm mb-4">
                <div>
                  <span className="text-muted-foreground">Tenants activos: </span>
                  <span className="text-white font-medium">{plan.activeTenantsCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="text-white font-medium">{plan.totalTenantsCount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button_1.Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(plan)}>
                  <lucide_react_1.Edit className="w-4 h-4 mr-1"/>
                  Editar
                </button_1.Button>
                <button_1.Button variant="outline" size="sm" onClick={() => setDeletingPlan(plan)} disabled={plan.totalTenantsCount > 0} className="text-red-400 hover:text-red-300">
                  <lucide_react_1.Trash2 className="w-4 h-4"/>
                </button_1.Button>
              </div>
            </div>))}
        </div>)}

      {/* Create/Edit Modal */}
      <dialog_1.Dialog open={showModal} onOpenChange={setShowModal}>
        <dialog_1.DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</dialog_1.DialogTitle>
            <dialog_1.DialogDescription>
              {editingPlan
            ? 'Modifica los detalles del plan'
            : 'Crea un nuevo plan con sus límites'}
            </dialog_1.DialogDescription>
          </dialog_1.DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label_1.Label htmlFor="codigo">Código</label_1.Label>
                <input id="codigo" type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} className="input-rc mt-1" placeholder="BASIC" required disabled={!!editingPlan}/>
              </div>
              <div>
                <label_1.Label htmlFor="nombre">Nombre</label_1.Label>
                <input id="nombre" type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-rc mt-1" placeholder="Plan Básico" required/>
              </div>
            </div>

            <div>
              <label_1.Label htmlFor="descripcion">Descripción</label_1.Label>
              <textarea id="descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-rc mt-1 min-h-[80px]" placeholder="Descripción del plan..."/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label_1.Label htmlFor="maxDtesPerMonth">DTEs por mes (-1 = ilimitado)</label_1.Label>
                <input id="maxDtesPerMonth" type="number" value={form.maxDtesPerMonth} onChange={(e) => setForm({ ...form, maxDtesPerMonth: parseInt(e.target.value) || 0 })} className="input-rc mt-1" min="-1" required/>
              </div>
              <div>
                <label_1.Label htmlFor="maxUsers">Usuarios máx (-1 = ilimitado)</label_1.Label>
                <input id="maxUsers" type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 0 })} className="input-rc mt-1" min="-1" required/>
              </div>
              <div>
                <label_1.Label htmlFor="maxClientes">Clientes máx (-1 = ilimitado)</label_1.Label>
                <input id="maxClientes" type="number" value={form.maxClientes} onChange={(e) => setForm({ ...form, maxClientes: parseInt(e.target.value) || 0 })} className="input-rc mt-1" min="-1" required/>
              </div>
              <div>
                <label_1.Label htmlFor="maxStorageMb">Storage MB (-1 = ilimitado)</label_1.Label>
                <input id="maxStorageMb" type="number" value={form.maxStorageMb} onChange={(e) => setForm({ ...form, maxStorageMb: parseInt(e.target.value) || 0 })} className="input-rc mt-1" min="-1" required/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label_1.Label htmlFor="precioMensual">Precio Mensual ($)</label_1.Label>
                <input id="precioMensual" type="number" step="0.01" value={form.precioMensual ?? ''} onChange={(e) => setForm({
            ...form,
            precioMensual: e.target.value ? parseFloat(e.target.value) : null,
        })} className="input-rc mt-1" min="0" placeholder="29.99"/>
              </div>
              <div>
                <label_1.Label htmlFor="precioAnual">Precio Anual ($)</label_1.Label>
                <input id="precioAnual" type="number" step="0.01" value={form.precioAnual ?? ''} onChange={(e) => setForm({
            ...form,
            precioAnual: e.target.value ? parseFloat(e.target.value) : null,
        })} className="input-rc mt-1" min="0" placeholder="299.99"/>
              </div>
            </div>

            <div>
              <label_1.Label htmlFor="features">Features (JSON array)</label_1.Label>
              <input id="features" type="text" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="input-rc mt-1" placeholder='["facturacion_basica", "reportes"]'/>
            </div>

            <div>
              <label_1.Label htmlFor="orden">Orden de visualización</label_1.Label>
              <input id="orden" type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value) || 0 })} className="input-rc mt-1" min="0"/>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <switch_1.Switch id="isDefault" checked={form.isDefault} onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}/>
                <label_1.Label htmlFor="isDefault">Plan por defecto</label_1.Label>
              </div>
              {editingPlan && (<div className="flex items-center gap-2">
                  <switch_1.Switch id="isActive" checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}/>
                  <label_1.Label htmlFor="isActive">Activo</label_1.Label>
                </div>)}
            </div>

            <dialog_1.DialogFooter>
              <button_1.Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </button_1.Button>
              <button_1.Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
              </button_1.Button>
            </dialog_1.DialogFooter>
          </form>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* Delete Confirmation Modal */}
      <dialog_1.Dialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <dialog_1.DialogContent className="sm:max-w-[400px]">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>Eliminar Plan</dialog_1.DialogTitle>
            <dialog_1.DialogDescription>
              ¿Estás seguro de que deseas eliminar el plan "{deletingPlan?.nombre}"?
              Esta acción no se puede deshacer.
            </dialog_1.DialogDescription>
          </dialog_1.DialogHeader>
          <dialog_1.DialogFooter>
            <button_1.Button variant="outline" onClick={() => setDeletingPlan(null)}>
              Cancelar
            </button_1.Button>
            <button_1.Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button_1.Button>
          </dialog_1.DialogFooter>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>
    </div>);
}
