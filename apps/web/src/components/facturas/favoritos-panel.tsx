'use client';

import * as React from 'react';
import {
  Star,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTemplatesStore, FavoriteItem } from '@/store/templates';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FavoritosPanelProps {
  onSelectFavorite: (item: FavoriteItem) => void;
  className?: string;
}

export function FavoritosPanel({
  onSelectFavorite,
  className,
}: FavoritosPanelProps) {
  const { favorites, deleteFavorite, getTopFavorites } = useTemplatesStore();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);

  const topFavorites = getTopFavorites(10);

  const handleSelect = (favorite: FavoriteItem) => {
    onSelectFavorite(favorite);
  };

  if (favorites.length === 0) {
    return (
      <div className={cn('glass-card p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <h3 className="font-medium text-sm">Productos Favoritos</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="h-7 px-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center py-4">
          <Star className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Sin favoritos todavia
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Agrega productos frecuentes para acceso rapido
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="mt-3"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar favorito
          </Button>
        </div>

        <AgregarFavoritoModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
        />
      </div>
    );
  }

  return (
    <div className={cn('glass-card p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <h3 className="font-medium text-sm">Productos Favoritos</h3>
          <span className="text-xs text-muted-foreground">
            ({favorites.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="h-7 px-2"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick tip */}
      <p className="text-xs text-muted-foreground mb-2">
        Click para agregar a la factura
      </p>

      {/* Favorites grid */}
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {topFavorites.map((favorite) => (
          <button
            key={favorite.id}
            onClick={() => handleSelect(favorite)}
            className="group relative p-2 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors"
          >
            <p className="text-sm font-medium text-white truncate pr-5">
              {favorite.descripcion}
            </p>
            <p className="text-xs text-primary">
              {formatCurrency(favorite.precioUnitario)}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFavorite(favorite.id);
              }}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-destructive transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>

      <AgregarFavoritoModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}

// Modal to add new favorite
interface AgregarFavoritoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    descripcion: string;
    precioUnitario: number;
    codigo?: string;
    esGravado?: boolean;
  };
}

export function AgregarFavoritoModal({
  open,
  onOpenChange,
  initialData,
}: AgregarFavoritoModalProps) {
  const { addFavorite } = useTemplatesStore();
  const [descripcion, setDescripcion] = React.useState(initialData?.descripcion || '');
  const [precio, setPrecio] = React.useState(initialData?.precioUnitario?.toString() || '');
  const [codigo, setCodigo] = React.useState(initialData?.codigo || '');
  const [esGravado, setEsGravado] = React.useState(initialData?.esGravado ?? true);

  React.useEffect(() => {
    if (initialData) {
      setDescripcion(initialData.descripcion);
      setPrecio(initialData.precioUnitario.toString());
      setCodigo(initialData.codigo || '');
      setEsGravado(initialData.esGravado ?? true);
    }
  }, [initialData]);

  const handleSave = () => {
    if (!descripcion.trim() || !precio) return;

    addFavorite({
      descripcion: descripcion.trim(),
      precioUnitario: parseFloat(precio),
      codigo: codigo.trim() || undefined,
      esGravado,
    });

    setDescripcion('');
    setPrecio('');
    setCodigo('');
    setEsGravado(true);
    onOpenChange(false);
  };

  const handleClose = () => {
    setDescripcion('');
    setPrecio('');
    setCodigo('');
    setEsGravado(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Agregar producto favorito
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Descripcion *
            </label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Servicio de consultoria"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Precio unitario *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Codigo (opcional)
              </label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="SKU-001"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={esGravado}
              onChange={(e) => setEsGravado(e.target.checked)}
              className="rounded border-muted-foreground/50"
            />
            <span className="text-sm">Producto gravado (13% IVA)</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!descripcion.trim() || !precio}
          >
            <Star className="w-4 h-4 mr-2" />
            Guardar favorito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Inline button to add item as favorite
interface AddToFavoritesButtonProps {
  item: {
    descripcion: string;
    precioUnitario: number;
    codigo?: string;
    esGravado: boolean;
  };
}

export function AddToFavoritesButton({ item }: AddToFavoritesButtonProps) {
  const { favorites, addFavorite } = useTemplatesStore();
  const [added, setAdded] = React.useState(false);

  const isAlreadyFavorite = favorites.some(
    (f) =>
      f.descripcion.toLowerCase() === item.descripcion.toLowerCase() &&
      f.precioUnitario === item.precioUnitario
  );

  const handleAdd = () => {
    if (isAlreadyFavorite) return;

    addFavorite({
      descripcion: item.descripcion,
      precioUnitario: item.precioUnitario,
      codigo: item.codigo,
      esGravado: item.esGravado,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isAlreadyFavorite || added) {
    return (
      <span className="text-yellow-500 text-xs flex items-center gap-1">
        <Star className="w-3 h-3 fill-yellow-500" />
        {added ? 'Agregado!' : 'Favorito'}
      </span>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className="text-muted-foreground hover:text-yellow-500 transition-colors"
      title="Agregar a favoritos"
    >
      <Star className="w-4 h-4" />
    </button>
  );
}
