'use client';

import { Settings, Server, Database, Mail, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Configuracion</h1>
        <p className="text-muted-foreground mt-1">Ajustes generales del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Sistema</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ambiente</span>
              <span className="badge-success">Produccion</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">API URL</span>
              <span className="text-white text-sm font-mono">
                {process.env.NEXT_PUBLIC_API_URL || 'No configurado'}
              </span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-secondary flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Base de Datos</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Proveedor</span>
              <span className="text-white">PostgreSQL (Supabase)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span className="badge-success">Conectado</span>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Email</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Servicio</span>
              <span className="text-white">No configurado</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span className="badge-warning">Pendiente</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Seguridad</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">JWT</span>
              <span className="badge-success">Configurado</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">CORS</span>
              <span className="badge-success">Activo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="glass-card p-8 text-center">
        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Mas configuraciones proximamente</h3>
        <p className="text-muted-foreground">
          Estamos trabajando en agregar mas opciones de configuracion como notificaciones por email,
          integraciones con pasarelas de pago, y mas.
        </p>
      </div>
    </div>
  );
}
