'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DTEStatusBadge } from '@/components/dte/dte-status-badge';
import { formatCurrency, formatDateTime, getTipoDteName } from '@/lib/utils';
import {
  ArrowLeft,
  Download,
  Ban,
  Copy,
  CheckCircle,
  Clock,
  Send,
  FileJson,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DTEDetail {
  id: string;
  numeroControl: string;
  codigoGeneracion: string;
  tipoDte: string;
  estado: string;
  selloRecepcion?: string;
  fechaRecepcion?: string;
  descripcionMh?: string;
  totalGravada: string | number;
  totalIva: string | number;
  totalPagar: string | number;
  jsonOriginal: string;
  jsonFirmado?: string;
  createdAt: string;
  updatedAt: string;
  cliente?: {
    id: string;
    nombre: string;
    numDocumento: string;
    nrc?: string;
    correo?: string;
    telefono?: string;
  };
  tenant?: {
    nombre: string;
    nit: string;
    nrc?: string;
  };
  logs?: Array<{
    id: string;
    accion: string;
    request?: string;
    response?: string;
    createdAt: string;
  }>;
}

const timelineIcons: Record<string, any> = {
  CREATED: Clock,
  SIGNED: FileJson,
  TRANSMITTED: Send,
  TRANSMISSION_ERROR: AlertCircle,
};

export default function FacturaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [dte, setDte] = React.useState<DTEDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [anulando, setAnulando] = React.useState(false);
  const [downloadingPdf, setDownloadingPdf] = React.useState(false);

  const dteId = params.id as string;

  React.useEffect(() => {
    const fetchDTE = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesion activa');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dte/${dteId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Error al cargar el documento');
        }

        const data = await res.json();
        setDte(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (dteId) {
      fetchDTE();
    }
  }, [dteId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadJSON = () => {
    if (!dte) return;

    try {
      const jsonData = typeof dte.jsonOriginal === 'string'
        ? JSON.parse(dte.jsonOriginal)
        : dte.jsonOriginal;
      const jsonStr = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DTE-${dte.codigoGeneracion}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar el JSON');
    }
  };

  const handleDownloadPDF = async () => {
    if (!dte) return;

    setDownloadingPdf(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dte/${dteId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DTE-${dte.numeroControl || dte.codigoGeneracion}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar el PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleAnular = async () => {
    if (!dte || !confirm('¿Estás seguro de que deseas anular este documento?')) return;

    setAnulando(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dte/${dteId}/anular`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo: 'Anulacion solicitada por usuario' }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al anular');
      }

      alert('Documento anulado correctamente');
      router.push('/facturas');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al anular el documento');
    } finally {
      setAnulando(false);
    }
  };

  const parseNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
  };

  const getJsonData = (): any => {
    if (!dte?.jsonOriginal) return null;
    try {
      return typeof dte.jsonOriginal === 'string'
        ? JSON.parse(dte.jsonOriginal)
        : dte.jsonOriginal;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !dte) {
    return (
      <div className="space-y-4">
        <Link href="/facturas">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error || 'Documento no encontrado'}
        </div>
      </div>
    );
  }

  const jsonData = getJsonData();
  const emisor = jsonData?.emisor || dte.tenant;
  const receptor = jsonData?.receptor || dte.cliente;
  const items = jsonData?.cuerpoDocumento || [];
  const resumen = jsonData?.resumen;
  const identificacion = jsonData?.identificacion;

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
              <DTEStatusBadge status={dte.estado as any} />
            </div>
            <p className="text-muted-foreground font-mono text-sm">
              {dte.numeroControl}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF} disabled={downloadingPdf}>
            {downloadingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Descargar PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadJSON}>
            <Download className="mr-2 h-4 w-4" />
            Descargar JSON
          </Button>
          {dte.estado === 'PROCESADO' && (
            <Button variant="destructive" onClick={handleAnular} disabled={anulando}>
              {anulando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
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
                  <Badge variant={identificacion?.ambiente === '01' ? 'default' : 'secondary'}>
                    {identificacion?.ambiente === '01' ? 'Produccion' : 'Pruebas'}
                  </Badge>
                </div>
                {dte.selloRecepcion && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Sello Recibido</p>
                    <code className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded break-all">
                      {dte.selloRecepcion}
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
                <p className="font-semibold">{emisor?.nombre || 'N/A'}</p>
                <p className="text-muted-foreground">NIT: {emisor?.nit || 'N/A'}</p>
                {emisor?.nrc && <p className="text-muted-foreground">NRC: {emisor.nrc}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receptor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">{receptor?.nombre || dte.cliente?.nombre || 'N/A'}</p>
                {(receptor?.numDocumento || dte.cliente?.numDocumento) && (
                  <p className="text-muted-foreground">
                    NIT: {receptor?.numDocumento || dte.cliente?.numDocumento}
                  </p>
                )}
                {(receptor?.nrc || dte.cliente?.nrc) && (
                  <p className="text-muted-foreground">NRC: {receptor?.nrc || dte.cliente?.nrc}</p>
                )}
                {(receptor?.correo || dte.cliente?.correo) && (
                  <p className="text-muted-foreground">{receptor?.correo || dte.cliente?.correo}</p>
                )}
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
                  {items.length > 0 ? (
                    items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.numItem || index + 1}</TableCell>
                        <TableCell>{item.descripcion}</TableCell>
                        <TableCell className="text-right">{item.cantidad}</TableCell>
                        <TableCell className="text-right">{formatCurrency(parseNumber(item.precioUni))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(parseNumber(item.ventaGravada))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(parseNumber(item.ivaItem || 0))}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay items disponibles
                      </TableCell>
                    </TableRow>
                  )}
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
                    <span>{formatCurrency(parseNumber(resumen?.totalGravada || dte.totalGravada))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (13%):</span>
                    <span>{formatCurrency(parseNumber(resumen?.totalIva || dte.totalIva))}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total a Pagar:</span>
                    <span>{formatCurrency(parseNumber(resumen?.totalPagar || dte.totalPagar))}</span>
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
                {dte.logs && dte.logs.length > 0 ? (
                  dte.logs.map((log, index) => {
                    const Icon = timelineIcons[log.accion] || Clock;
                    const isLast = index === dte.logs!.length - 1;

                    return (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full',
                              log.accion.includes('ERROR')
                                ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                                : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">{log.accion}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No hay eventos registrados</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Descripcion MH */}
          {dte.descripcionMh && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Respuesta MH</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{dte.descripcionMh}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
