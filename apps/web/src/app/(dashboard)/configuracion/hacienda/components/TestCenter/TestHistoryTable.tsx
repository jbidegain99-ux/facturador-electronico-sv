'use client';

import * as React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Send,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DTE_TYPES, type TestRecord, type DteTypeCode, type HaciendaTestType, type HaciendaTestStatus } from '../../types';

export function TestHistoryTable() {
  const [loading, setLoading] = React.useState(true);
  const [records, setRecords] = React.useState<TestRecord[]>([]);
  const [filterDteType, setFilterDteType] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  const loadHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterDteType !== 'all') params.set('dteType', filterDteType);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      params.set('limit', '50');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hacienda/tests/history?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }, [filterDteType, filterStatus]);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getStatusBadge = (status: HaciendaTestStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Exitosa
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Fallida
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTestTypeIcon = (testType: HaciendaTestType) => {
    switch (testType) {
      case 'EMISSION':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'CANCELLATION':
        return <Ban className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getTestTypeName = (testType: HaciendaTestType) => {
    switch (testType) {
      case 'EMISSION':
        return 'Emisión';
      case 'CANCELLATION':
        return 'Anulación';
      case 'CONTINGENCY':
        return 'Contingencia';
      default:
        return testType;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historial de Pruebas</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={filterDteType} onValueChange={setFilterDteType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de DTE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(DTE_TYPES).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="SUCCESS">Exitosas</SelectItem>
              <SelectItem value="FAILED">Fallidas</SelectItem>
              <SelectItem value="PENDING">Pendientes</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={loadHistory}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron pruebas con los filtros seleccionados
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo DTE</TableHead>
                  <TableHead>Prueba</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Sello</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {record.dteType}
                        </Badge>
                        <span className="text-sm">{record.dteName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTestTypeIcon(record.testType)}
                        <span className="text-sm">{getTestTypeName(record.testType)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        {record.codigoGeneracion
                          ? `${record.codigoGeneracion.slice(0, 8)}...`
                          : '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        {record.selloRecibido
                          ? `${record.selloRecibido.slice(0, 12)}...`
                          : '-'}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(record.executedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
