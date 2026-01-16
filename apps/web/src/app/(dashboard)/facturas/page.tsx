'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DTEStatusBadge } from '@/components/dte/dte-status-badge';
import { formatCurrency, formatDate, getTipoDteName } from '@/lib/utils';
import { Plus, Search, Filter, Download, Eye, Ban, MoreHorizontal } from 'lucide-react';
import { DTEStatus, TipoDte } from '@/types';

// Mock data
const mockDTEs = [
  { id: '1', numeroControl: 'DTE-01-M001P001-000000000000001', codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890', receptorNombre: 'Cliente ABC S.A. de C.V.', receptorDocumento: '0614-180494-103-5', totalPagar: 1250.00, status: 'PROCESADO' as DTEStatus, selloRecibido: '2024011612345678901234567890123456789012', createdAt: '2024-01-16T10:30:00Z', tipoDte: '01' as TipoDte },
  { id: '2', numeroControl: 'DTE-03-M001P001-000000000000002', codigoGeneracion: 'B2C3D4E5-F6A7-8901-BCDE-FA2345678901', receptorNombre: 'Empresa XYZ', receptorDocumento: '0614-180494-103-6', totalPagar: 3450.00, status: 'PROCESANDO' as DTEStatus, createdAt: '2024-01-16T09:15:00Z', tipoDte: '03' as TipoDte },
  { id: '3', numeroControl: 'DTE-01-M001P001-000000000000003', codigoGeneracion: 'C3D4E5F6-A7B8-9012-CDEF-AB3456789012', receptorNombre: 'Comercial 123', receptorDocumento: '00000000-0', totalPagar: 890.50, status: 'RECHAZADO' as DTEStatus, createdAt: '2024-01-15T16:45:00Z', tipoDte: '01' as TipoDte },
  { id: '4', numeroControl: 'DTE-01-M001P001-000000000000004', codigoGeneracion: 'D4E5F6A7-B8C9-0123-DEFA-BC4567890123', receptorNombre: 'Tienda Plus', receptorDocumento: '00000000-0', totalPagar: 2100.00, status: 'PROCESADO' as DTEStatus, selloRecibido: '2024011512345678901234567890123456789012', createdAt: '2024-01-15T14:20:00Z', tipoDte: '01' as TipoDte },
  { id: '5', numeroControl: 'DTE-03-M001P001-000000000000005', codigoGeneracion: 'E5F6A7B8-C9D0-1234-EFAB-CD5678901234', receptorNombre: 'Distribuidora El Sol', receptorDocumento: '0614-180494-103-7', totalPagar: 5670.00, status: 'PROCESADO' as DTEStatus, selloRecibido: '2024011412345678901234567890123456789012', createdAt: '2024-01-15T11:00:00Z', tipoDte: '03' as TipoDte },
  { id: '6', numeroControl: 'DTE-05-M001P001-000000000000006', codigoGeneracion: 'F6A7B8C9-D0E1-2345-FABC-DE6789012345', receptorNombre: 'Cliente ABC S.A. de C.V.', receptorDocumento: '0614-180494-103-5', totalPagar: 250.00, status: 'ANULADO' as DTEStatus, createdAt: '2024-01-14T09:00:00Z', tipoDte: '05' as TipoDte },
];

export default function FacturasPage() {
  const [search, setSearch] = React.useState('');
  const [filterTipo, setFilterTipo] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  const filteredDTEs = mockDTEs.filter((dte) => {
    const matchesSearch =
      dte.numeroControl.toLowerCase().includes(search.toLowerCase()) ||
      dte.receptorNombre.toLowerCase().includes(search.toLowerCase()) ||
      dte.codigoGeneracion.toLowerCase().includes(search.toLowerCase());
    const matchesTipo = filterTipo === 'all' || dte.tipoDte === filterTipo;
    const matchesStatus = filterStatus === 'all' || dte.status === filterStatus;
    return matchesSearch && matchesTipo && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">
            Gestiona tus documentos tributarios electronicos
          </p>
        </div>
        <Link href="/facturas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por numero, cliente o codigo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo DTE" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="01">Factura</SelectItem>
                <SelectItem value="03">Credito Fiscal</SelectItem>
                <SelectItem value="05">Nota de Credito</SelectItem>
                <SelectItem value="06">Nota de Debito</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="PROCESANDO">Procesando</SelectItem>
                <SelectItem value="PROCESADO">Procesado</SelectItem>
                <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                <SelectItem value="ANULADO">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Numero Control</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDTEs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron documentos
                  </TableCell>
                </TableRow>
              ) : (
                filteredDTEs.map((dte) => (
                  <TableRow key={dte.id}>
                    <TableCell className="font-medium">
                      {formatDate(dte.createdAt)}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {dte.numeroControl}
                      </code>
                    </TableCell>
                    <TableCell>{getTipoDteName(dte.tipoDte)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{dte.receptorNombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {dte.receptorDocumento}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(dte.totalPagar)}
                    </TableCell>
                    <TableCell>
                      <DTEStatusBadge status={dte.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/facturas/${dte.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        {dte.status === 'PROCESADO' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
