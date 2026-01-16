'use client';

import { Badge } from '@/components/ui/badge';
import { DTEStatus } from '@/types';
import { CheckCircle, Clock, XCircle, Loader2, Ban, AlertTriangle } from 'lucide-react';

interface DTEStatusBadgeProps {
  status: DTEStatus;
  showIcon?: boolean;
  size?: 'sm' | 'default';
}

const statusConfig: Record<
  DTEStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'; icon: typeof CheckCircle }
> = {
  PENDIENTE: { label: 'Pendiente', variant: 'warning', icon: Clock },
  PROCESANDO: { label: 'Procesando', variant: 'info', icon: Loader2 },
  PROCESADO: { label: 'Procesado', variant: 'success', icon: CheckCircle },
  RECHAZADO: { label: 'Rechazado', variant: 'destructive', icon: XCircle },
  ANULADO: { label: 'Anulado', variant: 'secondary', icon: Ban },
  ERROR: { label: 'Error', variant: 'destructive', icon: AlertTriangle },
};

export function DTEStatusBadge({ status, showIcon = true, size = 'default' }: DTEStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDIENTE;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={size === 'sm' ? 'text-xs px-2 py-0.5' : ''}>
      {showIcon && (
        <Icon
          className={`mr-1 ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} ${
            status === 'PROCESANDO' ? 'animate-spin' : ''
          }`}
        />
      )}
      {config.label}
    </Badge>
  );
}
