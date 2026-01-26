'use client';

import { Server, Database, Mail, Shield, BookOpen, Gauge, Bell, FileText, HardDrive, Webhook, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
              <span className="text-white">Azure SQL Database</span>
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

      {/* Available Features */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Modulos Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Catalogos */}
          <Link href="/admin/catalogos" className="glass-card p-5 hover:border-purple-500/50 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">Gestion de Catalogos</h3>
              <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground">
              Administra catalogos del MH: actividades economicas, departamentos, municipios.
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
              Disponible
            </span>
          </Link>

          {/* Planes */}
          <Link href="/admin/planes" className="glass-card p-5 hover:border-purple-500/50 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">Planes y Limites</h3>
              <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground">
              Configura limites de DTEs, usuarios y almacenamiento por plan.
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
              Disponible
            </span>
          </Link>

          {/* Notificaciones */}
          <Link href="/admin/notificaciones" className="glass-card p-5 hover:border-purple-500/50 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">Notificaciones</h3>
              <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground">
              Alertas del sistema, emails automaticos y notificaciones push.
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
              Disponible
            </span>
          </Link>

          {/* Logs y Auditoria */}
          <Link href="/admin/logs" className="glass-card p-5 hover:border-purple-500/50 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">Logs y Auditoria</h3>
              <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground">
              Historial de acciones, logs del sistema y auditoria de seguridad.
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
              Disponible
            </span>
          </Link>

          {/* Backups */}
          <Link href="/admin/backups" className="glass-card p-5 hover:border-purple-500/50 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">Backups</h3>
              <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground">
              Programacion de backups, restauracion y retencion de datos.
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
              Disponible
            </span>
          </Link>

          {/* Webhooks */}
          <Link href="/admin/webhooks" className="glass-card p-5 hover:border-purple-500/50 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <Webhook className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">Integraciones y Webhooks</h3>
              <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground">
              APIs externas, webhooks y conectores con sistemas ERP.
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
              Disponible
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
