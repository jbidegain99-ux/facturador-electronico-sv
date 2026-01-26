'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Download,
  Upload,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Catalogo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  version: string;
  totalItems: number;
  lastSyncAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CatalogoItem {
  id: string;
  codigo: string;
  valor: string;
  descripcion: string | null;
  parentCodigo: string | null;
  orden: number;
  isActive: boolean;
}

interface ItemsResponse {
  data: CatalogoItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function CatalogosPage() {
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  // Items modal state
  const [selectedCatalogo, setSelectedCatalogo] = useState<Catalogo | null>(null);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);
  const [itemsSearch, setItemsSearch] = useState('');
  const [parentFilter, setParentFilter] = useState('');
  const [departamentos, setDepartamentos] = useState<CatalogoItem[]>([]);

  useEffect(() => {
    fetchCatalogos();
  }, []);

  const fetchCatalogos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/catalogos`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error('Error al cargar catalogos');
      }

      const data = await res.json();
      setCatalogos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/catalogos/seed`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al crear catalogos');
      alert('Catalogos creados correctamente');
      fetchCatalogos();
    } catch (err) {
      alert('Error al crear catalogos');
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedDepartamentos = async () => {
    try {
      setSeeding(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/catalogos/seed/departamentos`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al crear departamentos');
      alert('Departamentos creados correctamente');
      fetchCatalogos();
    } catch (err) {
      alert('Error al crear departamentos');
    } finally {
      setSeeding(false);
    }
  };

  const handleExport = async (codigo: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/catalogos/${codigo}/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al exportar');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${codigo}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al exportar el catalogo');
    }
  };

  const openItemsModal = async (catalogo: Catalogo) => {
    setSelectedCatalogo(catalogo);
    setItemsPage(1);
    setItemsSearch('');
    setParentFilter('');

    // If it's municipios, load departamentos for filtering
    if (catalogo.codigo === 'CAT-013') {
      await loadDepartamentos();
    }

    await fetchItems(catalogo.codigo, 1, '', '');
  };

  const loadDepartamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/catalogos/CAT-012/items?limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data: ItemsResponse = await res.json();
        setDepartamentos(data.data);
      }
    } catch (err) {
      console.error('Error loading departamentos:', err);
    }
  };

  const fetchItems = async (
    codigo: string,
    page: number,
    search: string,
    parentCodigo: string,
  ) => {
    try {
      setItemsLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(parentCodigo && { parentCodigo }),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/catalogos/${codigo}/items?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error('Error al cargar items');

      const data: ItemsResponse = await res.json();
      setItems(data.data);
      setItemsTotalPages(data.meta.totalPages);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleItemsSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCatalogo) {
      setItemsPage(1);
      fetchItems(selectedCatalogo.codigo, 1, itemsSearch, parentFilter);
    }
  };

  const getStatusInfo = (catalogo: Catalogo) => {
    if (!catalogo.lastSyncAt) {
      return { label: 'Sin datos', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    }

    const lastSync = new Date(catalogo.lastSyncAt);
    const daysSince = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince > 90) {
      return { label: 'Revisar', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    }

    return { label: 'Actual', color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catalogos del MH</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los catalogos oficiales del Ministerio de Hacienda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSeedDepartamentos}
            disabled={seeding}
          >
            <Database className="w-4 h-4 mr-2" />
            Cargar Departamentos
          </Button>
          <Button
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Inicializar Catalogos
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="glass-card p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-muted-foreground">
            Los catalogos oficiales pueden descargarse desde{' '}
            <a
              href="https://factura.gob.sv"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              factura.gob.sv
            </a>
            . Usa el boton "Inicializar Catalogos" para crear la estructura inicial,
            luego puedes sincronizar cada catalogo con los datos oficiales.
          </p>
        </div>
      </div>

      {/* Catalogos Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-card p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      ) : catalogos.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sin catalogos</h3>
          <p className="text-muted-foreground mb-6">
            No hay catalogos configurados. Haz clic en "Inicializar Catalogos" para comenzar.
          </p>
          <Button onClick={handleSeed} disabled={seeding}>
            <Database className="w-4 h-4 mr-2" />
            Inicializar Catalogos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogos.map((catalogo) => {
            const status = getStatusInfo(catalogo);
            return (
              <div key={catalogo.id} className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-mono text-primary">{catalogo.codigo}</span>
                    <h3 className="text-lg font-semibold text-white mt-1">{catalogo.nombre}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {catalogo.descripcion && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {catalogo.descripcion}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-muted-foreground">Items: </span>
                      <span className="text-white font-medium">{catalogo.totalItems}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">v</span>
                      <span className="text-white">{catalogo.version}</span>
                    </div>
                  </div>
                </div>

                {catalogo.lastSyncAt && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                    <Clock className="w-3 h-3" />
                    Sincronizado: {new Date(catalogo.lastSyncAt).toLocaleDateString('es')}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openItemsModal(catalogo)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Items
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(catalogo.codigo)}
                    disabled={catalogo.totalItems === 0}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Items Modal */}
      <Dialog open={!!selectedCatalogo} onOpenChange={() => setSelectedCatalogo(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedCatalogo?.codigo} - {selectedCatalogo?.nombre}
            </DialogTitle>
            <DialogDescription>
              {selectedCatalogo?.totalItems} items en este catalogo
            </DialogDescription>
          </DialogHeader>

          {/* Search & Filters */}
          <form onSubmit={handleItemsSearch} className="flex gap-2 my-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por codigo o valor..."
                value={itemsSearch}
                onChange={(e) => setItemsSearch(e.target.value)}
                className="input-rc pl-10"
              />
            </div>

            {/* Parent filter for municipios */}
            {selectedCatalogo?.codigo === 'CAT-013' && departamentos.length > 0 && (
              <Select
                value={parentFilter}
                onValueChange={(value) => {
                  setParentFilter(value === 'ALL' ? '' : value);
                  if (selectedCatalogo) {
                    setItemsPage(1);
                    fetchItems(selectedCatalogo.codigo, 1, itemsSearch, value === 'ALL' ? '' : value);
                  }
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {departamentos.map((dep) => (
                    <SelectItem key={dep.codigo} value={dep.codigo}>
                      {dep.valor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button type="submit">Buscar</Button>
          </form>

          {/* Items Table */}
          <div className="flex-1 overflow-auto">
            {itemsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay items en este catalogo
              </div>
            ) : (
              <table className="table-rc w-full">
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Valor</th>
                    {selectedCatalogo?.codigo === 'CAT-013' && <th>Departamento</th>}
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="font-mono text-sm">{item.codigo}</td>
                      <td>{item.valor}</td>
                      {selectedCatalogo?.codigo === 'CAT-013' && (
                        <td className="text-muted-foreground">{item.parentCodigo || '-'}</td>
                      )}
                      <td>
                        {item.isActive ? (
                          <span className="text-green-400 text-xs">Activo</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Inactivo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {itemsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Pagina {itemsPage} de {itemsTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(1, itemsPage - 1);
                    setItemsPage(newPage);
                    if (selectedCatalogo) {
                      fetchItems(selectedCatalogo.codigo, newPage, itemsSearch, parentFilter);
                    }
                  }}
                  disabled={itemsPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.min(itemsTotalPages, itemsPage + 1);
                    setItemsPage(newPage);
                    if (selectedCatalogo) {
                      fetchItems(selectedCatalogo.codigo, newPage, itemsSearch, parentFilter);
                    }
                  }}
                  disabled={itemsPage === itemsTotalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
