'use client';

import { Webhook, Clock, Zap, Lock, RefreshCw, FileText, Send, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Integraciones y notificaciones en tiempo real
          </p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="glass-card p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Webhook className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Próximamente</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          El sistema de webhooks permitirá integrar el facturador con sistemas externos.
          Recibe notificaciones en tiempo real sobre eventos del sistema.
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
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Eventos en Tiempo Real</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Recibe notificaciones instantáneas sobre DTEs emitidos, rechazados,
            nuevos clientes y cambios en el sistema.
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Lock className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Seguridad</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Firmas HMAC para verificar autenticidad. Tokens secretos por webhook
            y reintentos automáticos con backoff.
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <ExternalLink className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Integraciones</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Conecta con ERPs, CRMs, sistemas contables y cualquier aplicación
            que soporte webhooks.
          </p>
        </div>
      </div>

      {/* Supported Events Preview */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Eventos Disponibles (Preview)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { event: 'dte.created', desc: 'DTE creado' },
            { event: 'dte.signed', desc: 'DTE firmado' },
            { event: 'dte.transmitted', desc: 'DTE transmitido' },
            { event: 'dte.accepted', desc: 'DTE aceptado por MH' },
            { event: 'dte.rejected', desc: 'DTE rechazado por MH' },
            { event: 'cliente.created', desc: 'Cliente creado' },
            { event: 'cliente.updated', desc: 'Cliente actualizado' },
            { event: 'user.login', desc: 'Inicio de sesión' },
            { event: 'plan.limit_warning', desc: 'Advertencia de límite' },
          ].map((item) => (
            <div key={item.event} className="p-3 rounded-lg bg-white/5 flex items-center gap-3">
              <Send className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-mono text-primary">{item.event}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated Config */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configuración (Simulado)</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <div>
                <div className="text-white">Mi Webhook de Prueba</div>
                <div className="text-xs text-muted-foreground font-mono">
                  https://api.ejemplo.com/webhooks/facturador
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Sin configurar
            </div>
          </div>
          <Button variant="outline" disabled className="w-full">
            <Webhook className="w-4 h-4 mr-2" />
            Configurar Webhook
          </Button>
        </div>
      </div>
    </div>
  );
}
