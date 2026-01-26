'use client';

import { HardDrive, Clock, AlertCircle, CheckCircle, Download, Upload, RefreshCw, Calendar, Database, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BackupsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backups</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de copias de seguridad del sistema
          </p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="glass-card p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <HardDrive className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Próximamente</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          El sistema de backups automatizados estará disponible pronto. Podrás programar
          copias de seguridad, descargar backups manuales y restaurar datos.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-full text-sm">
          <Clock className="w-4 h-4" />
          En desarrollo
        </div>
      </div>

      {/* Preview Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Backups Programados</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Configura backups automáticos diarios, semanales o mensuales.
            Define horarios y políticas de retención.
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Download className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Descarga Manual</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Genera y descarga backups bajo demanda. Exporta datos específicos
            por tenant o del sistema completo.
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Restauración</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Restaura datos desde cualquier punto de backup. Incluye verificación
            de integridad y rollback selectivo.
          </p>
        </div>
      </div>

      {/* Simulated Status */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Estado del Sistema (Simulado)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Último Backup</span>
            </div>
            <div className="text-white">- - -</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Espacio Usado</span>
            </div>
            <div className="text-white">- - -</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Backups Activos</span>
            </div>
            <div className="text-white">- - -</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Estado</span>
            </div>
            <div className="text-yellow-400">Pendiente</div>
          </div>
        </div>
      </div>
    </div>
  );
}
