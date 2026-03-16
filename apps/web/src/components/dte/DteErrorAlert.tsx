'use client';

import { AlertCircle, RotateCcw, Pencil } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DteErrorAlertProps {
  userMessage: string;
  suggestedAction: string;
  resolvable: boolean;
  errorCode?: string;
  onRetry?: () => void;
  onEdit?: () => void;
  onDismiss?: () => void;
}

export function DteErrorAlert({
  userMessage,
  suggestedAction,
  resolvable,
  errorCode,
  onRetry,
  onEdit,
  onDismiss,
}: DteErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="ml-2">
        <div className="font-semibold mb-1">{userMessage}</div>
        <div className="text-sm opacity-90 mb-3">{suggestedAction}</div>
        {errorCode && (
          <div className="text-xs opacity-60 mb-2">Codigo: {errorCode}</div>
        )}
        <div className="flex gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw className="w-3 h-3 mr-1" />
              Reintentar
            </Button>
          )}
          {resolvable && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="w-3 h-3 mr-1" />
              Editar datos
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Cerrar
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
