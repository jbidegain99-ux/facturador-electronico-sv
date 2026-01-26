'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Users,
  FileText,
  Database,
  HardDrive,
  Infinity,
  ToggleLeft,
  ToggleRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  maxDtesPerMonth: number;
  maxUsers: number;
  maxClientes: number;
  maxStorageMb: number;
  features: string | null;
  precioMensual: number | null;
  precioAnual: number | null;
  isActive: boolean;
  isDefault: boolean;
  orden: number;
  activeTenantsCount: number;
  totalTenantsCount: number;
}

interface PlanForm {
  codigo: string;
  nombre: string;
  descripcion: string;
  maxDtesPerMonth: number;
  maxUsers: number;
  maxClientes: number;
  maxStorageMb: number;
  features: string;
  precioMensual: number | null;
  precioAnual: number | null;
  orden: number;
  isDefault: boolean;
  isActive: boolean;
}

const initialForm: PlanForm = {
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

export default function PlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(initialForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/plans`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al cargar planes');

      const data = await res.json();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/plans/seed`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al crear planes');
      alert('Planes creados correctamente');
      fetchPlans();
    } catch (err) {
      alert('Error al crear planes');
    } finally {
      setSeeding(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (plan: Plan) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const url = editingPlan
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/plans/${editingPlan.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/plans`;

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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/plans/${deletingPlan.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al eliminar plan');
      }

      setDeletingPlan(null);
      fetchPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar plan');
    } finally {
      setDeleting(false);
    }
  };

  const formatLimit = (value: number) => {
    return value === -1 ? <Infinity className="w-4 h-4 inline" /> : value.toLocaleString();
  };

  const formatPrice = (value: number | null) => {
    if (value === null) return '-';
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los planes y límites para los tenants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={seeding}>
            <Database className="w-4 h-4 mr-2" />
            Inicializar Planes
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Plan
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-card p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sin planes</h3>
          <p className="text-muted-foreground mb-6">
            No hay planes configurados. Haz clic en "Inicializar Planes" para crear los planes por defecto.
          </p>
          <Button onClick={handleSeed} disabled={seeding}>
            <Database className="w-4 h-4 mr-2" />
            Inicializar Planes
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-card p-5 relative ${!plan.isActive ? 'opacity-60' : ''}`}
            >
              {/* Default badge */}
              {plan.isDefault && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Default
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-primary">{plan.codigo}</span>
                  <h3 className="text-lg font-semibold text-white mt-1">{plan.nombre}</h3>
                </div>
                <div className="flex items-center gap-1">
                  {plan.isActive ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      Activo
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                      Inactivo
                    </span>
                  )}
                </div>
              </div>

              {plan.descripcion && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {plan.descripcion}
                </p>
              )}

              {/* Limits */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">DTEs/mes:</span>
                  <span className="text-white font-medium">{formatLimit(plan.maxDtesPerMonth)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Usuarios:</span>
                  <span className="text-white font-medium">{formatLimit(plan.maxUsers)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Clientes:</span>
                  <span className="text-white font-medium">{formatLimit(plan.maxClientes)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Storage:</span>
                  <span className="text-white font-medium">
                    {plan.maxStorageMb === -1 ? (
                      <Infinity className="w-4 h-4 inline" />
                    ) : (
                      `${plan.maxStorageMb} MB`
                    )}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditModal(plan)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingPlan(plan)}
                  disabled={plan.totalTenantsCount > 0}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? 'Modifica los detalles del plan'
                : 'Crea un nuevo plan con sus límites'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigo">Código</Label>
                <input
                  id="codigo"
                  type="text"
                  value={form.codigo}
                  onChange={(e) =>
                    setForm({ ...form, codigo: e.target.value.toUpperCase() })
                  }
                  className="input-rc mt-1"
                  placeholder="BASIC"
                  required
                  disabled={!!editingPlan}
                />
              </div>
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <input
                  id="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="input-rc mt-1"
                  placeholder="Plan Básico"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="input-rc mt-1 min-h-[80px]"
                placeholder="Descripción del plan..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxDtesPerMonth">DTEs por mes (-1 = ilimitado)</Label>
                <input
                  id="maxDtesPerMonth"
                  type="number"
                  value={form.maxDtesPerMonth}
                  onChange={(e) =>
                    setForm({ ...form, maxDtesPerMonth: parseInt(e.target.value) || 0 })
                  }
                  className="input-rc mt-1"
                  min="-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxUsers">Usuarios máx (-1 = ilimitado)</Label>
                <input
                  id="maxUsers"
                  type="number"
                  value={form.maxUsers}
                  onChange={(e) =>
                    setForm({ ...form, maxUsers: parseInt(e.target.value) || 0 })
                  }
                  className="input-rc mt-1"
                  min="-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxClientes">Clientes máx (-1 = ilimitado)</Label>
                <input
                  id="maxClientes"
                  type="number"
                  value={form.maxClientes}
                  onChange={(e) =>
                    setForm({ ...form, maxClientes: parseInt(e.target.value) || 0 })
                  }
                  className="input-rc mt-1"
                  min="-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxStorageMb">Storage MB (-1 = ilimitado)</Label>
                <input
                  id="maxStorageMb"
                  type="number"
                  value={form.maxStorageMb}
                  onChange={(e) =>
                    setForm({ ...form, maxStorageMb: parseInt(e.target.value) || 0 })
                  }
                  className="input-rc mt-1"
                  min="-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="precioMensual">Precio Mensual ($)</Label>
                <input
                  id="precioMensual"
                  type="number"
                  step="0.01"
                  value={form.precioMensual ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      precioMensual: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="input-rc mt-1"
                  min="0"
                  placeholder="29.99"
                />
              </div>
              <div>
                <Label htmlFor="precioAnual">Precio Anual ($)</Label>
                <input
                  id="precioAnual"
                  type="number"
                  step="0.01"
                  value={form.precioAnual ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      precioAnual: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="input-rc mt-1"
                  min="0"
                  placeholder="299.99"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="features">Features (JSON array)</Label>
              <input
                id="features"
                type="text"
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                className="input-rc mt-1"
                placeholder='["facturacion_basica", "reportes"]'
              />
            </div>

            <div>
              <Label htmlFor="orden">Orden de visualización</Label>
              <input
                id="orden"
                type="number"
                value={form.orden}
                onChange={(e) =>
                  setForm({ ...form, orden: parseInt(e.target.value) || 0 })
                }
                className="input-rc mt-1"
                min="0"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="isDefault"
                  checked={form.isDefault}
                  onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}
                />
                <Label htmlFor="isDefault">Plan por defecto</Label>
              </div>
              {editingPlan && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Activo</Label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar Plan</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el plan "{deletingPlan?.nombre}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPlan(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
