'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Send,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailConfig, HealthStatus, ConnectionTestResult } from '@/types/email-config';

interface ConnectionStatusProps {
  config: EmailConfig | null;
  onTestConnection: () => Promise<ConnectionTestResult>;
  onSendTest: (email: string) => Promise<void>;
  loading?: boolean;
}

export function ConnectionStatus({
  config,
  onTestConnection,
  onSendTest,
  loading = false,
}: ConnectionStatusProps) {
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<ConnectionTestResult | null>(null);
  const [sendingTest, setSendingTest] = React.useState(false);
  const [testEmail, setTestEmail] = React.useState('');
  const [showTestForm, setShowTestForm] = React.useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTestConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        responseTimeMs: 0,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setSendingTest(true);
    try {
      await onSendTest(testEmail);
      setShowTestForm(false);
      setTestEmail('');
    } finally {
      setSendingTest(false);
    }
  };

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estado de Conexión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hay configuración de email. Configure un proveedor para comenzar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Estado de Conexión
        </CardTitle>
        <CardDescription>
          Verifique que su configuración está funcionando correctamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-3">
            <StatusIcon
              isActive={config.isActive}
              isVerified={config.isVerified}
            />
            <div>
              <p className="font-medium">
                {getStatusText(config.isActive, config.isVerified)}
              </p>
              <p className="text-sm text-muted-foreground">
                Proveedor: {config.provider.replace('_', ' ')}
              </p>
            </div>
          </div>

          {config.lastTestAt && (
            <div className="text-right text-sm text-muted-foreground">
              <p>Última prueba:</p>
              <p>{new Date(config.lastTestAt).toLocaleString('es-SV')}</p>
            </div>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <div
            className={cn(
              'p-4 rounded-lg border',
              testResult.success
                ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
            )}
          >
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">{testResult.message}</p>
                {testResult.responseTimeMs > 0 && (
                  <p className="text-sm opacity-80">
                    Tiempo de respuesta: {testResult.responseTimeMs}ms
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={loading || testing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', testing && 'animate-spin')} />
            {testing ? 'Probando...' : 'Probar Conexión'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowTestForm(!showTestForm)}
            disabled={loading || !config.isVerified}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Correo de Prueba
          </Button>
        </div>

        {/* Test email form */}
        {showTestForm && (
          <div className="p-4 rounded-lg bg-muted space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email de destino
              </label>
              <input
                type="email"
                placeholder="prueba@ejemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md border bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSendTest}
                disabled={!testEmail || sendingTest}
              >
                {sendingTest ? 'Enviando...' : 'Enviar'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTestForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Verification status */}
        {config.isVerified && config.verifiedAt && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Verificado el {new Date(config.verifiedAt).toLocaleDateString('es-SV')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusIcon({ isActive, isVerified }: { isActive: boolean; isVerified: boolean }) {
  if (!isVerified) {
    return (
      <div className="p-2 rounded-full bg-amber-500/20">
        <Clock className="h-5 w-5 text-amber-500" />
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="p-2 rounded-full bg-green-500/20">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      </div>
    );
  }

  return (
    <div className="p-2 rounded-full bg-muted">
      <AlertCircle className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

function getStatusText(isActive: boolean, isVerified: boolean): string {
  if (!isVerified) {
    return 'Pendiente de verificación';
  }
  if (isActive) {
    return 'Activo y funcionando';
  }
  return 'Verificado pero inactivo';
}

// Compact status badge for use in headers
export function StatusBadge({ config }: { config: EmailConfig | null }) {
  if (!config) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
        No configurado
      </span>
    );
  }

  if (!config.isVerified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        Pendiente
      </span>
    );
  }

  if (config.isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Activo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
      Inactivo
    </span>
  );
}
