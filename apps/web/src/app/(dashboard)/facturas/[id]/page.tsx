'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DTEStatusBadge } from '@/components/dte/dte-status-badge';
import { formatCurrency, formatDate, formatDateTime, getTipoDteName } from '@/lib/utils';
import {
  ArrowLeft,
  Download,
  Ban,
  Copy,
  CheckCircle,
  Clock,
  Send,
  FileJson,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data
const mockDTE = {
  id: '1',
  numeroControl: 'DTE-01-M001P001-000000000000001',
  codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
  tipoDte: '01' as const,
  ambiente: '00' as const,
  status: 'PROCESADO' as const,
  selloRecibido: '2024011612345678901234567890123456789012',
  fhProcesamiento: '2024-01-16T10:30:45.123Z',
  createdAt: '2024-01-16T10:30:00Z',
  emisor: {
    nombre: 'MI EMPRESA S.A. DE C.V.',
    nit: '0614-180494-103-5',
    nrc: '1234567',
  },
  receptor: {
    nombre: 'Cliente ABC S.A. de C.V.',
    nit: '0614-180494-103-6',
    nrc: '7654321',
    correo: 'cliente@abc.com.sv',
  },
  items: [
    { numItem: 1, descripcion: 'Producto A', cantidad: 5, precioUni: 100.00, ventaGravada: 500.00, iva: 65.00 },
    { numItem: 2, descripcion: 'Servicio B', cantidad: 2, precioUni: 250.00, ventaGravada: 500.00, iva: 65.00 },
    { numItem: 3, descripcion: 'Producto C', cantidad: 10, precioUni: 25.00, ventaGravada: 250.00, iva: 32.50 },
  ],
  resumen: {
    totalGravada: 1250.00,
    totalIva: 162.50,
    totalPagar: 1412.50,
    condicionOperacion: 1,
  },
};

const mockLogs = [
  { id: '1', action: 'CREATE', status: 'SUCCESS', message: 'DTE creado', createdAt: '2024-01-16T10:30:00Z' },
  { id: '2', action: 'SIGN', status: 'SUCCESS', message: 'DTE firmado con certificado', createdAt: '2024-01-16T10:30:15Z' },
  { id: '3', action: 'TRANSMIT', status: 'SUCCESS', message: 'Iniciando transmision al MH', createdAt: '2024-01-16T10:30:20Z' },
  { id: '4', action: 'RESPONSE', status: 'SUCCESS', message: 'DTE procesado: 2024011612345678901234567890123456789012', createdAt: '2024-01-16T10:30:45Z' },
];

const timelineIcons = {
  CREATE: Clock,
  SIGN: FileJson,
  TRANSMIT: Send,
  RESPONSE: CheckCircle,
  ERROR: Ban,
};

export default function FacturaDetallePage() {
  const params = useParams();
  const dte = mockDTE;
  const logs = mockLogs;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facturas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {getTipoDteName(dte.tipoDte)}
              </h1>
              <DTEStatusBadge status={dte.status} />
            </div>
            <p className="text-muted-foreground font-mono text-sm">
              {dte.numeroControl}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar JSON
          </Button>
          {dte.status === 'PROCESADO' && (
            <Button variant="destructive">
              <Ban className="mr-2 h-4 w-4" />
              Anular
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info General */}
          <Card>
            <CardHeader>
              <CardTitle>Informacion General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Codigo Generacion</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{dte.codigoGeneracion}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(dte.codigoGeneracion)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha Emision</p>
                  <p className="font-medium">{formatDateTime(dte.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ambiente</p>
                  <Badge variant={dte.ambiente === '01' ? 'default' : 'secondary'}>
                    {dte.ambiente === '01' ? 'Produccion' : 'Pruebas'}
                  </Badge>
                </div>
                {dte.selloRecibido && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Sello Recibido</p>
                    <code className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded break-all">
                      {dte.selloRecibido}
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emisor y Receptor */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Emisor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">{dte.emisor.nombre}</p>
                <p className="text-muted-foreground">NIT: {dte.emisor.nit}</p>
                <p className="text-muted-foreground">NRC: {dte.emisor.nrc}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receptor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">{dte.receptor.nombre}</p>
                <p className="text-muted-foreground">NIT: {dte.receptor.nit}</p>
                {dte.receptor.nrc && <p className="text-muted-foreground">NRC: {dte.receptor.nrc}</p>}
                {dte.receptor.correo && <p className="text-muted-foreground">{dte.receptor.correo}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Gravado</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dte.items.map((item) => (
                    <TableRow key={item.numItem}>
                      <TableCell>{item.numItem}</TableCell>
                      <TableCell>{item.descripcion}</TableCell>
                      <TableCell className="text-right">{item.cantidad}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.precioUni)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.ventaGravada)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.iva)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal Gravado:</span>
                    <span>{formatCurrency(dte.resumen.totalGravada)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (13%):</span>
                    <span>{formatCurrency(dte.resumen.totalIva)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total a Pagar:</span>
                    <span>{formatCurrency(dte.resumen.totalPagar)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Historial de eventos del documento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log, index) => {
                  const Icon = timelineIcons[log.action as keyof typeof timelineIcons] || Clock;
                  const isLast = index === logs.length - 1;

                  return (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full',
                            log.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                              : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
