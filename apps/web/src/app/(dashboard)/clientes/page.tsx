'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Cliente } from '@/types';

// Mock data
const mockClientes: Cliente[] = [
  { id: '1', tipoDocumento: '36', numDocumento: '0614-180494-103-5', nrc: '1234567', nombre: 'Empresa ABC S.A. de C.V.', codActividad: '47190', descActividad: 'Venta al por menor', telefono: '2222-3333', correo: 'contacto@empresaabc.com', createdAt: '2024-01-10T10:00:00Z' },
  { id: '2', tipoDocumento: '36', numDocumento: '0614-180494-103-6', nrc: '7654321', nombre: 'Distribuidora XYZ', codActividad: '46210', descActividad: 'Venta al por mayor', telefono: '2555-6666', correo: 'ventas@xyz.com', createdAt: '2024-01-08T14:30:00Z' },
  { id: '3', tipoDocumento: '13', numDocumento: '00000000-0', nombre: 'Juan Perez', telefono: '7888-9999', correo: 'juan@gmail.com', createdAt: '2024-01-05T09:15:00Z' },
  { id: '4', tipoDocumento: '36', numDocumento: '0614-180494-103-7', nrc: '9876543', nombre: 'Comercial El Sol S.A. de C.V.', codActividad: '47520', descActividad: 'Ferreteria', telefono: '2333-4444', correo: 'info@comercialelsol.com', createdAt: '2024-01-02T16:45:00Z' },
];

const tipoDocumentoLabels: Record<string, string> = {
  '36': 'NIT',
  '13': 'DUI',
  '02': 'Carnet Residente',
  '03': 'Pasaporte',
  '37': 'Otro',
};

export default function ClientesPage() {
  const [search, setSearch] = React.useState('');
  const [clientes, setClientes] = React.useState(mockClientes);

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.numDocumento.includes(search) ||
      c.correo?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('¿Estas seguro de eliminar este cliente?')) {
      setClientes(clientes.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu base de clientes para facturacion rapida
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, documento o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>NRC</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{cliente.nombre}</div>
                          {cliente.descActividad && (
                            <div className="text-xs text-muted-foreground">
                              {cliente.descActividad}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {tipoDocumentoLabels[cliente.tipoDocumento]}
                        </Badge>
                        <div className="font-mono text-sm">{cliente.numDocumento}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cliente.nrc ? (
                        <span className="font-mono text-sm">{cliente.nrc}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {cliente.telefono && <div>{cliente.telefono}</div>}
                        {cliente.correo && (
                          <div className="text-muted-foreground">{cliente.correo}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(cliente.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(cliente.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
