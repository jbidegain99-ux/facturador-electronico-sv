'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTEStatusBadge = DTEStatusBadge;
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const statusConfig = {
    PENDIENTE: { label: 'Pendiente', variant: 'warning', icon: lucide_react_1.Clock },
    FIRMADO: { label: 'Firmado', variant: 'info', icon: lucide_react_1.FileSignature },
    ENVIADO: { label: 'Enviado', variant: 'info', icon: lucide_react_1.Send },
    PROCESANDO: { label: 'Procesando', variant: 'info', icon: lucide_react_1.Loader2 },
    PROCESADO: { label: 'Procesado', variant: 'success', icon: lucide_react_1.CheckCircle },
    RECHAZADO: { label: 'Rechazado', variant: 'destructive', icon: lucide_react_1.XCircle },
    ANULADO: { label: 'Anulado', variant: 'secondary', icon: lucide_react_1.Ban },
    ERROR: { label: 'Error', variant: 'destructive', icon: lucide_react_1.AlertTriangle },
};
function DTEStatusBadge({ status, showIcon = true, size = 'default' }) {
    const config = statusConfig[status] || statusConfig.PENDIENTE;
    const Icon = config.icon;
    return (<badge_1.Badge variant={config.variant} className={size === 'sm' ? 'text-xs px-2 py-0.5' : ''}>
      {showIcon && (<Icon className={`mr-1 ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} ${status === 'PROCESANDO' ? 'animate-spin' : ''}`}/>)}
      {config.label}
    </badge_1.Badge>);
}
