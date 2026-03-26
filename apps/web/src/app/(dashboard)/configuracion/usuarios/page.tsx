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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  Users,
  Shield,
  X,
  ChevronDown,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { createApiFetcher } from '@/hooks/use-api';

// ── Types ────────────────────────────────────────────────────────────
interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
}

interface RolePermission {
  permission: Permission;
}

interface Role {
  id: string;
  tenantId: string | null;
  name: string;
  templateOrigin: string | null;
  isSystem: boolean;
  permissions?: RolePermission[];
  _count?: { assignments: number; permissions: number };
}

interface RoleAssignment {
  id: string;
  role: { id: string; name: string };
  scopeType: string;
  scopeId: string | null;
}

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  assignments: RoleAssignment[];
}

interface Sucursal {
  id: string;
  nombre: string;
}

interface Template {
  id: string;
  name: string;
  permissions: RolePermission[];
}

// ── Component ────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const toast = useToast();
  const router = useRouter();
  const api = createApiFetcher();

  // Data state
  const [users, setUsers] = React.useState<User[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [sucursales, setSucursales] = React.useState<Sucursal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Assign role dialog
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [assignUserId, setAssignUserId] = React.useState<string | null>(null);
  const [assignRoleId, setAssignRoleId] = React.useState('');
  const [assignScopeType, setAssignScopeType] = React.useState('TENANT');
  const [assignScopeId, setAssignScopeId] = React.useState('');
  const [assigning, setAssigning] = React.useState(false);

  // Role dialog (create/edit)
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<Role | null>(null);
  const [roleName, setRoleName] = React.useState('');
  const [roleTemplateId, setRoleTemplateId] = React.useState('');
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(new Set());
  const [savingRole, setSavingRole] = React.useState(false);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());

  // Delete role
  const [deleteRoleTarget, setDeleteRoleTarget] = React.useState<Role | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, permsRes, templatesRes, sucursalesRes] = await Promise.all([
        api<User[]>('/api/v1/rbac/users').catch(() => [] as User[]),
        api<Role[]>('/api/v1/rbac/roles').catch(() => [] as Role[]),
        api<Permission[]>('/api/v1/rbac/permissions').catch(() => [] as Permission[]),
        api<Template[]>('/api/v1/rbac/templates').catch(() => [] as Template[]),
        api<Sucursal[]>('/sucursales').catch(() => [] as Sucursal[]),
      ]);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setRoles(Array.isArray(rolesRes) ? rolesRes : []);
      setPermissions(Array.isArray(permsRes) ? permsRes : []);
      setTemplates(Array.isArray(templatesRes) ? templatesRes : []);
      setSucursales(Array.isArray(sucursalesRes) ? sucursalesRes : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Permission helpers ─────────────────────────────────────────────
  const permissionsByCategory = React.useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      const cat = p.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });
    return grouped;
  }, [permissions]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllInCategory = (cat: string, select: boolean) => {
    const catPerms = permissionsByCategory[cat] || [];
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      catPerms.forEach((p) => {
        if (select) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  // ── Assign role handlers ───────────────────────────────────────────
  const openAssignDialog = (userId: string) => {
    setAssignUserId(userId);
    setAssignRoleId('');
    setAssignScopeType('TENANT');
    setAssignScopeId('');
    setAssignDialogOpen(true);
  };

  const handleAssignRole = async () => {
    if (!assignUserId || !assignRoleId) return;
    setAssigning(true);
    try {
      await api(`/api/v1/rbac/users/${assignUserId}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          roleId: assignRoleId,
          scopeType: assignScopeType,
          scopeId: assignScopeType === 'TENANT' ? undefined : assignScopeId || undefined,
        }),
      });
      setAssignDialogOpen(false);
      toast.success('Rol asignado correctamente');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al asignar rol');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (userId: string, assignmentId: string) => {
    try {
      await api(`/api/v1/rbac/users/${userId}/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      toast.success('Asignacion eliminada');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar asignacion');
    }
  };

  // ── Role CRUD handlers ─────────────────────────────────────────────
  const openCreateRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleTemplateId('');
    setSelectedPermissions(new Set());
    setExpandedCategories(new Set());
    setRoleDialogOpen(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleTemplateId('');
    const permIds = new Set((role.permissions || []).map((rp) => rp.permission.id));
    setSelectedPermissions(permIds);
    setExpandedCategories(new Set(Object.keys(permissionsByCategory)));
    setRoleDialogOpen(true);
  };

  const handleTemplateChange = (templateId: string) => {
    setRoleTemplateId(templateId);
    if (templateId) {
      const tpl = templates.find((t) => t.id === templateId);
      if (tpl?.permissions) {
        setSelectedPermissions(new Set(tpl.permissions.map((rp) => rp.permission.id)));
      }
    }
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return;
    setSavingRole(true);
    try {
      if (editingRole) {
        await api(`/api/v1/rbac/roles/${editingRole.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: roleName,
            permissionIds: Array.from(selectedPermissions),
          }),
        });
        toast.success('Rol actualizado');
      } else {
        await api('/api/v1/rbac/roles', {
          method: 'POST',
          body: JSON.stringify({
            name: roleName,
            templateId: roleTemplateId || undefined,
            permissionIds: Array.from(selectedPermissions),
          }),
        });
        toast.success('Rol creado');
      }
      setRoleDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar rol');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleTarget) return;
    setDeleting(true);
    try {
      await api(`/api/v1/rbac/roles/${deleteRoleTarget.id}`, { method: 'DELETE' });
      setDeleteRoleTarget(null);
      toast.success('Rol eliminado');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar rol');
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
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
            <Users className="w-7 h-7 text-primary" />
            Usuarios y Roles
          </h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios de tu empresa y sus permisos de acceso
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
          <Button variant="link" className="ml-2 text-red-700" onClick={fetchData}>
            Reintentar
          </Button>
        </div>
      )}

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">
            <Users className="w-4 h-4 mr-1.5" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-1.5" />
            Roles
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Usuarios ─────────────────────────────────────────── */}
        <TabsContent value="usuarios">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4"><SkeletonTable rows={4} /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol (legacy)</TableHead>
                      <TableHead>Roles RBAC</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">No hay usuarios registrados</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.nombre}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.rol}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(user.assignments || []).map((a) => (
                                <Badge key={a.id} variant="info" className="gap-1">
                                  {a.role.name}
                                  {a.scopeType !== 'TENANT' && (
                                    <span className="text-[10px] opacity-70">
                                      ({a.scopeType})
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleRemoveAssignment(user.id, a.id)}
                                    className="ml-0.5 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                              {(!user.assignments || user.assignments.length === 0) && (
                                <span className="text-xs text-muted-foreground">Sin roles</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignDialog(user.id)}
                            >
                              Asignar Rol
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Roles ────────────────────────────────────────────── */}
        <TabsContent value="roles">
          <div className="flex justify-end mb-4">
            <Button onClick={openCreateRole}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Rol
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4"><SkeletonTable rows={4} /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Permisos</TableHead>
                      <TableHead>Usuarios</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">No hay roles configurados</p>
                          <p className="text-sm mt-1">Crea un rol para comenzar</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{role.name}</span>
                              {role.isSystem && (
                                <Badge variant="secondary" className="text-[10px]">Sistema</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {role.templateOrigin || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {role._count?.permissions ?? role.permissions?.length ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {role._count?.assignments ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditRole(role)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {!role.isSystem && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteRoleTarget(role)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
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
        </TabsContent>
      </Tabs>

      {/* ── Assign Role Dialog ──────────────────────────────────────── */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Asignar Rol</DialogTitle>
            <DialogDescription>
              Selecciona el rol y el alcance de la asignacion
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Rol *</label>
              <Select value={assignRoleId} onValueChange={setAssignRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Alcance</label>
              <Select value={assignScopeType} onValueChange={setAssignScopeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TENANT">Tenant (toda la empresa)</SelectItem>
                  <SelectItem value="SUCURSAL">Sucursal</SelectItem>
                  <SelectItem value="POS">Punto de Venta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {assignScopeType !== 'TENANT' && (
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {assignScopeType === 'SUCURSAL' ? 'Sucursal' : 'Punto de Venta'}
                </label>
                {assignScopeType === 'SUCURSAL' ? (
                  <Select value={assignScopeId} onValueChange={setAssignScopeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {sucursales.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="ID del punto de venta"
                    value={assignScopeId}
                    onChange={(e) => setAssignScopeId(e.target.value)}
                  />
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={assigning || !assignRoleId}
            >
              {assigning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Asignando...</>
              ) : (
                'Asignar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Role Create/Edit Dialog ─────────────────────────────────── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Crear Rol'}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Modifica el nombre y permisos del rol'
                : 'Define un nuevo rol con sus permisos'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre del Rol *</label>
              <Input
                placeholder="Ej: Contador, Cajero, Gerente..."
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>

            {!editingRole && templates.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Plantilla (opcional)</label>
                <Select value={roleTemplateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Copiar permisos de una plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Permission matrix */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Permisos ({selectedPermissions.size} seleccionados)
              </label>
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {Object.entries(permissionsByCategory).map(([cat, catPerms]) => {
                  const isExpanded = expandedCategories.has(cat);
                  const allSelected = catPerms.every((p) => selectedPermissions.has(p.id));
                  const someSelected = catPerms.some((p) => selectedPermissions.has(p.id));
                  return (
                    <div key={cat}>
                      <div
                        className="flex items-center justify-between px-3 py-2 bg-muted/50 cursor-pointer hover:bg-muted"
                        onClick={() => toggleCategory(cat)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium capitalize">{cat}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {catPerms.filter((p) => selectedPermissions.has(p.id)).length}/{catPerms.length}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAllInCategory(cat, !allSelected);
                          }}
                        >
                          {allSelected || someSelected ? 'Quitar todos' : 'Seleccionar todos'}
                        </Button>
                      </div>
                      {isExpanded && (
                        <div className="px-3 py-2 space-y-2">
                          {catPerms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-start gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedPermissions.has(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                                className="mt-0.5"
                              />
                              <div>
                                <div className="text-sm">{perm.name}</div>
                                {perm.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {perm.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {permissions.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No hay permisos disponibles
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={savingRole || !roleName.trim()}
            >
              {savingRole ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
              ) : editingRole ? (
                'Guardar Cambios'
              ) : (
                'Crear Rol'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Role Confirmation ────────────────────────────────── */}
      <Dialog open={!!deleteRoleTarget} onOpenChange={() => setDeleteRoleTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminacion</DialogTitle>
            <DialogDescription>
              {deleteRoleTarget && (
                <>
                  Estas seguro de eliminar el rol <strong>{deleteRoleTarget.name}</strong>?
                  Se removera de todos los usuarios asignados. Esta accion no se puede deshacer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRoleTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={deleting}
            >
              {deleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</>
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
