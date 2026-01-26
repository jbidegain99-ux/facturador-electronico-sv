'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Shield,
  Megaphone,
  Settings,
  Zap,
  Eye,
  EyeOff,
  Clock,
  Users,
  Building,
  User,
  CreditCard,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  target: string;
  targetTenantId: string | null;
  targetUserId: string | null;
  targetPlanIds: string | null;
  startsAt: string;
  expiresAt: string | null;
  isDismissable: boolean;
  showOnce: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { dismissals: number };
}

interface Tenant {
  id: string;
  nombre: string;
  nit: string;
}

interface NotificationForm {
  title: string;
  message: string;
  type: string;
  priority: string;
  target: string;
  targetTenantId: string;
  targetUserId: string;
  targetPlanIds: string;
  startsAt: string;
  expiresAt: string;
  isDismissable: boolean;
  showOnce: boolean;
  actionUrl: string;
  actionLabel: string;
  isActive: boolean;
}

const initialForm: NotificationForm = {
  title: '',
  message: '',
  type: 'GENERAL',
  priority: 'MEDIUM',
  target: 'ALL_USERS',
  targetTenantId: '',
  targetUserId: '',
  targetPlanIds: '',
  startsAt: '',
  expiresAt: '',
  isDismissable: true,
  showOnce: false,
  actionUrl: '',
  actionLabel: '',
  isActive: true,
};

const typeOptions = [
  { value: 'SYSTEM_ANNOUNCEMENT', label: 'Anuncio del Sistema', icon: Megaphone },
  { value: 'MAINTENANCE', label: 'Mantenimiento', icon: Settings },
  { value: 'NEW_FEATURE', label: 'Nueva Función', icon: Zap },
  { value: 'PLAN_LIMIT_WARNING', label: 'Límite de Plan', icon: AlertTriangle },
  { value: 'PLAN_EXPIRED', label: 'Plan Expirado', icon: AlertCircle },
  { value: 'SECURITY_ALERT', label: 'Alerta de Seguridad', icon: Shield },
  { value: 'GENERAL', label: 'General', icon: Info },
];

const priorityOptions = [
  { value: 'LOW', label: 'Baja', color: 'text-gray-400' },
  { value: 'MEDIUM', label: 'Media', color: 'text-blue-400' },
  { value: 'HIGH', label: 'Alta', color: 'text-orange-400' },
  { value: 'URGENT', label: 'Urgente', color: 'text-red-400' },
];

const targetOptions = [
  { value: 'ALL_USERS', label: 'Todos los usuarios', icon: Users },
  { value: 'ALL_TENANTS', label: 'Todos los tenants', icon: Building },
  { value: 'SPECIFIC_TENANT', label: 'Tenant específico', icon: Building },
  { value: 'SPECIFIC_USER', label: 'Usuario específico', icon: User },
  { value: 'BY_PLAN', label: 'Por plan', icon: CreditCard },
];

// Helper to get current datetime in local format for min attribute
const getCurrentDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [form, setForm] = useState<NotificationForm>(initialForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingNotification, setDeletingNotification] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Tenants for dropdown
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [showInactive]);

  useEffect(() => {
    if (showModal && form.target === 'SPECIFIC_TENANT' && tenants.length === 0) {
      fetchTenants();
    }
  }, [showModal, form.target]);

  const fetchTenants = async () => {
    try {
      setLoadingTenants(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/super-admin/tenants?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al cargar empresas');

      const data = await res.json();
      setTenants(data.data || []);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoadingTenants(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/notifications?includeInactive=${showInactive}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al cargar notificaciones');

      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingNotification(null);
    setFormError('');
    setForm({
      ...initialForm,
      startsAt: getCurrentDateTime(),
    });
    setShowModal(true);
  };

  const openEditModal = (notification: Notification) => {
    setEditingNotification(notification);
    setFormError('');

    // If the original startsAt is in the past, set it to current time
    const originalStartsAt = notification.startsAt ? new Date(notification.startsAt) : new Date();
    const now = new Date();
    const startsAtValue = originalStartsAt < now
      ? getCurrentDateTime()
      : new Date(notification.startsAt).toISOString().slice(0, 16);

    setForm({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      target: notification.target,
      targetTenantId: notification.targetTenantId || '',
      targetUserId: notification.targetUserId || '',
      targetPlanIds: notification.targetPlanIds || '',
      startsAt: startsAtValue,
      expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toISOString().slice(0, 16) : '',
      isDismissable: notification.isDismissable,
      showOnce: notification.showOnce,
      actionUrl: notification.actionUrl || '',
      actionLabel: notification.actionLabel || '',
      isActive: notification.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate start date is not in the past
    if (form.startsAt) {
      const startsAtDate = new Date(form.startsAt);
      const now = new Date();
      if (startsAtDate < now) {
        setFormError('La fecha de inicio no puede ser en el pasado');
        return;
      }
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const url = editingNotification
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/notifications/${editingNotification.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/notifications`;

      const body: any = {
        title: form.title,
        message: form.message,
        type: form.type,
        priority: form.priority,
        target: form.target,
        isDismissable: form.isDismissable,
        showOnce: form.showOnce,
      };

      if (form.targetTenantId) body.targetTenantId = form.targetTenantId;
      if (form.targetUserId) body.targetUserId = form.targetUserId;
      if (form.targetPlanIds) body.targetPlanIds = form.targetPlanIds;
      if (form.startsAt) body.startsAt = new Date(form.startsAt).toISOString();
      if (form.expiresAt) body.expiresAt = new Date(form.expiresAt).toISOString();
      if (form.actionUrl) body.actionUrl = form.actionUrl;
      if (form.actionLabel) body.actionLabel = form.actionLabel;
      if (editingNotification) body.isActive = form.isActive;

      const res = await fetch(url, {
        method: editingNotification ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al guardar notificación');
      }

      setShowModal(false);
      fetchNotifications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingNotification) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/notifications/${deletingNotification.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al eliminar');

      setDeletingNotification(null);
      fetchNotifications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (notification: Notification) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = notification.isActive ? 'deactivate' : 'activate';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/notifications/${notification.id}/${endpoint}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al cambiar estado');
      fetchNotifications();
    } catch (err) {
      alert('Error al cambiar estado de la notificación');
    }
  };

  const getTypeIcon = (type: string) => {
    const option = typeOptions.find((t) => t.value === type);
    const Icon = option?.icon || Info;
    return <Icon className="w-4 h-4" />;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      LOW: 'bg-gray-500/20 text-gray-400',
      MEDIUM: 'bg-blue-500/20 text-blue-400',
      HIGH: 'bg-orange-500/20 text-orange-400',
      URGENT: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
      URGENT: 'Urgente',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badges[priority] || badges.MEDIUM}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const getTargetLabel = (target: string) => {
    const option = targetOptions.find((t) => t.value === target);
    return option?.label || target;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las notificaciones del sistema para los usuarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Switch
              id="showInactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="showInactive" className="text-sm">
              Mostrar inactivas
            </Label>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Notificación
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-card p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sin notificaciones</h3>
          <p className="text-muted-foreground mb-6">
            No hay notificaciones configuradas. Crea una nueva para comunicarte con los usuarios.
          </p>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Notificación
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`glass-card p-5 ${!notification.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Type Icon */}
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getTypeIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{notification.title}</h3>
                    {getPriorityBadge(notification.priority)}
                    {!notification.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                        Inactiva
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {notification.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {getTargetLabel(notification.target)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Desde: {new Date(notification.startsAt).toLocaleDateString('es')}
                    </div>
                    {notification.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Hasta: {new Date(notification.expiresAt).toLocaleDateString('es')}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      {notification._count.dismissals} descartadas
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(notification)}
                    title={notification.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {notification.isActive ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(notification)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingNotification(notification)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNotification ? 'Editar Notificación' : 'Nueva Notificación'}
            </DialogTitle>
            <DialogDescription>
              {editingNotification
                ? 'Modifica los detalles de la notificación'
                : 'Crea una nueva notificación para los usuarios'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-rc mt-1"
                placeholder="Título de la notificación"
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Mensaje</Label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="input-rc mt-1 min-h-[100px]"
                placeholder="Mensaje de la notificación..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) => setForm({ ...form, priority: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Destinatarios</Label>
              <Select
                value={form.target}
                onValueChange={(value) => setForm({ ...form, target: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.target === 'SPECIFIC_TENANT' && (
              <div>
                <Label>Empresa</Label>
                {loadingTenants ? (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Cargando empresas...
                  </div>
                ) : (
                  <Select
                    value={form.targetTenantId}
                    onValueChange={(value) => setForm({ ...form, targetTenantId: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.nombre} ({tenant.nit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {form.target === 'SPECIFIC_USER' && (
              <div>
                <Label htmlFor="targetUserId">ID del Usuario</Label>
                <input
                  id="targetUserId"
                  type="text"
                  value={form.targetUserId}
                  onChange={(e) => setForm({ ...form, targetUserId: e.target.value })}
                  className="input-rc mt-1"
                  placeholder="ID del usuario"
                />
              </div>
            )}

            {form.target === 'BY_PLAN' && (
              <div>
                <Label htmlFor="targetPlanIds">IDs de Planes (JSON array)</Label>
                <input
                  id="targetPlanIds"
                  type="text"
                  value={form.targetPlanIds}
                  onChange={(e) => setForm({ ...form, targetPlanIds: e.target.value })}
                  className="input-rc mt-1"
                  placeholder='["plan-id-1", "plan-id-2"]'
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startsAt">Fecha de inicio</Label>
                <input
                  id="startsAt"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => {
                    setFormError('');
                    setForm({ ...form, startsAt: e.target.value });
                  }}
                  min={getCurrentDateTime()}
                  className="input-rc mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Solo se permiten fechas actuales o futuras
                </p>
              </div>
              <div>
                <Label htmlFor="expiresAt">Fecha de expiración</Label>
                <input
                  id="expiresAt"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  min={form.startsAt || getCurrentDateTime()}
                  className="input-rc mt-1"
                />
              </div>
            </div>

            {formError && (
              <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actionUrl">URL de acción (opcional)</Label>
                <input
                  id="actionUrl"
                  type="text"
                  value={form.actionUrl}
                  onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                  className="input-rc mt-1"
                  placeholder="/settings"
                />
              </div>
              <div>
                <Label htmlFor="actionLabel">Texto del botón</Label>
                <input
                  id="actionLabel"
                  type="text"
                  value={form.actionLabel}
                  onChange={(e) => setForm({ ...form, actionLabel: e.target.value })}
                  className="input-rc mt-1"
                  placeholder="Ver más"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isDismissable"
                    checked={form.isDismissable}
                    onCheckedChange={(checked) => setForm({ ...form, isDismissable: checked })}
                  />
                  <Label htmlFor="isDismissable">Descartable</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="showOnce"
                    checked={form.showOnce}
                    onCheckedChange={(checked) => setForm({ ...form, showOnce: checked })}
                  />
                  <Label htmlFor="showOnce">Mostrar una vez</Label>
                </div>
              </div>
              {editingNotification && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Activa</Label>
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
                {saving ? 'Guardando...' : editingNotification ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingNotification} onOpenChange={() => setDeletingNotification(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar Notificación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la notificación "{deletingNotification?.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingNotification(null)}>
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
