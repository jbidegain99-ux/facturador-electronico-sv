'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Pencil,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';
import { NuevoProveedorModal } from '@/components/purchases/nuevo-proveedor-modal';
import type { Proveedor } from '@/types/purchase';

interface ProveedoresResponse {
  data: Proveedor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

export default function ProveedoresPage() {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [proveedores, setProveedores] = React.useState<Proveedor[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const toast = useToast();

  const fetchProveedores = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        isSupplier: 'true',
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search.trim()) params.set('search', search.trim());

      const data = await apiFetch<ProveedoresResponse>(`/clientes?${params}`);
      const items = Array.isArray(data?.data) ? data.data : [];
      setProveedores(items);
      setTotal(Number(data?.total) || items.length);
      setTotalPages(Number(data?.totalPages) >= 1 ? Number(data.totalPages) : 1);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  React.useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  // Reset page on search change
  React.useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreated = async (p: Proveedor) => {
    toast.success(`Proveedor ${p.nombre} creado exitosamente`);
    await fetchProveedores();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
            <Truck className="w-5 h-5 text-fuchsia-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Proveedores</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Cargando...' : `${total} proveedores registrados`}
            </p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo proveedor
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, NIT, NRC..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={5} />
            </div>
          ) : loadError ? (
            <div className="p-8 text-center text-destructive">
              <p>{loadError}</p>
              <Button variant="outline" className="mt-2" onClick={fetchProveedores}>
                Reintentar
              </Button>
            </div>
          ) : proveedores.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {search ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
              </p>
              {!search && (
                <Button className="mt-4 gap-2" onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Agregar primer proveedor
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>NIT</TableHead>
                      <TableHead>NRC</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead>Gran Contrib.</TableHead>
                      <TableHead>Retiene ISR</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proveedores.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-fuchsia-600">
                                {p.nombre.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{p.nombre}</p>
                              {p.correo && (
                                <p className="text-xs text-muted-foreground">{p.correo}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{p.numDocumento}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {p.nrc ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {p.telefono ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {p.esGranContribuyente ? (
                            <Badge variant="outline" className="border-amber-500 text-amber-600">
                              GC
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.retieneISR ? (
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                              ISR
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/proveedores/${p.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Pencil className="w-3 h-3" />
                              Editar
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {proveedores.map((p) => (
                  <Link
                    key={p.id}
                    href={`/proveedores/${p.id}`}
                    className="block p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-fuchsia-600">
                            {p.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {p.numDocumento}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {p.esGranContribuyente && (
                          <Badge
                            variant="outline"
                            className="border-amber-500 text-amber-600 text-xs"
                          >
                            GC
                          </Badge>
                        )}
                        {p.retieneISR && (
                          <Badge
                            variant="outline"
                            className="border-blue-500 text-blue-600 text-xs"
                          >
                            ISR
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1 || loading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages || loading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      <NuevoProveedorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
