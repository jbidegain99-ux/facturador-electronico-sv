'use client';

import { API_URL } from '@/lib/api';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Lock, Loader2, Mail, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// ─── Types ─────────────────────────────────────────────────

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  tenant: {
    id: string;
    nombre: string;
    nit: string;
  } | null;
}

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// ─── Helpers ───────────────────────────────────────────────

function getRolLabel(rol: string): string {
  switch (rol) {
    case 'SUPER_ADMIN':
      return 'Super Administrador';
    case 'ADMIN':
      return 'Administrador';
    case 'USER':
      return 'Usuario';
    default:
      return rol;
  }
}

function getRolVariant(rol: string): 'default' | 'secondary' | 'outline' {
  switch (rol) {
    case 'SUPER_ADMIN':
      return 'default';
    case 'ADMIN':
      return 'secondary';
    default:
      return 'outline';
  }
}

function validatePasswordForm(form: ChangePasswordForm): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.currentPassword) {
    errors.currentPassword = 'La contraseña actual es requerida';
  }

  if (!form.newPassword) {
    errors.newPassword = 'La nueva contraseña es requerida';
  } else if (form.newPassword.length < 8) {
    errors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
  } else if (form.newPassword.length > 128) {
    errors.newPassword = 'La contraseña no puede exceder 128 caracteres';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Debes confirmar la nueva contraseña';
  } else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  return errors;
}

// ─── Component ─────────────────────────────────────────────

export default function PerfilPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const toastSuccessRef = React.useRef(toastSuccess);
  const toastErrorRef = React.useRef(toastError);
  toastSuccessRef.current = toastSuccess;
  toastErrorRef.current = toastError;

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [passwordForm, setPasswordForm] = React.useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [changingPassword, setChangingPassword] = React.useState(false);

  // Load profile
  React.useEffect(() => {
    const loadProfile = async () => {

      try {
        const res = await fetch(`${API_URL}/auth/profile`, { credentials: 'include',
          headers: {
            'Content-Type': 'application/json' } });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al cargar el perfil');
        }

        const data: UserProfile = await res.json();
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handlePasswordChange = (field: keyof ChangePasswordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleChangePassword = async () => {
    // Validate
    const errors = validatePasswordForm(passwordForm);
    const hasErrors = Object.values(errors).some(e => e);
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }


    setChangingPassword(true);
    setFieldErrors({});

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, { credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword }) });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cambiar la contraseña');
      }

      toastSuccessRef.current('Contraseña cambiada', 'Tu contraseña ha sido actualizada exitosamente');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Error changing password:', err);
      const message = err instanceof Error ? err.message : 'Error al cambiar la contraseña';
      toastErrorRef.current('Error', message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Informacion de tu cuenta y seguridad</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Informacion de tu cuenta y seguridad
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informacion Personal
            </CardTitle>
            <CardDescription>
              Datos de tu cuenta de usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={profile?.nombre || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo Electronico
              </label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rol
              </label>
              <div>
                <Badge variant={getRolVariant(profile?.rol || '')}>
                  {getRolLabel(profile?.rol || '')}
                </Badge>
              </div>
            </div>
            {profile?.tenant && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Empresa</label>
                <Input
                  value={profile.tenant.nombre}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña de acceso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Contraseña Actual</label>
              <Input
                type="password"
                placeholder="********"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className={fieldErrors.currentPassword ? 'border-red-500' : ''}
              />
              {fieldErrors.currentPassword && (
                <p className="text-xs text-red-500">{fieldErrors.currentPassword}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nueva Contraseña</label>
              <Input
                type="password"
                placeholder="Minimo 8 caracteres"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className={fieldErrors.newPassword ? 'border-red-500' : ''}
              />
              {fieldErrors.newPassword && (
                <p className="text-xs text-red-500">{fieldErrors.newPassword}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Confirmar Nueva Contraseña</label>
              <Input
                type="password"
                placeholder="Repite la nueva contraseña"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
              )}
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="w-full"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
