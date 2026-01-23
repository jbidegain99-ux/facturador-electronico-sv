'use client';

import * as React from 'react';
import {
  Files,
  Plus,
  Trash2,
  Clock,
  Star,
  ChevronRight,
  Search,
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
import { useTemplatesStore, InvoiceTemplate } from '@/store/templates';
import { cn } from '@/lib/utils';

interface PlantillasPanelProps {
  onSelectTemplate: (template: InvoiceTemplate) => void;
  className?: string;
}

export function PlantillasPanel({
  onSelectTemplate,
  className,
}: PlantillasPanelProps) {
  const { templates, deleteTemplate, getTopTemplates } = useTemplatesStore();
  const [search, setSearch] = React.useState('');
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);

  const filteredTemplates = React.useMemo(() => {
    if (!search) return templates;
    const lower = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.description?.toLowerCase().includes(lower)
    );
  }, [templates, search]);

  const topTemplates = getTopTemplates(3);

  const handleSelect = (template: InvoiceTemplate) => {
    onSelectTemplate(template);
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    setDeleteConfirm(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-SV', {
      day: '2-digit',
      month: 'short',
    });
  };

  if (templates.length === 0) {
    return (
      <div className={cn('glass-card p-4', className)}>
        <div className="flex items-center gap-2 mb-3">
          <Files className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">Plantillas</h3>
        </div>
        <div className="text-center py-6">
          <Files className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No tienes plantillas guardadas
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Crea una factura y guardala como plantilla para usarla despues
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('glass-card p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Files className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">Plantillas</h3>
          <span className="text-xs text-muted-foreground">
            ({templates.length})
          </span>
        </div>
      </div>

      {/* Top used templates */}
      {topTemplates.length > 0 && !search && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Star className="w-3 h-3" /> Mas usadas
          </p>
          <div className="space-y-1">
            {topTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {template.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {template.items.length} items
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {templates.length > 3 && (
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar plantilla..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      )}

      {/* All templates */}
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <button
              onClick={() => handleSelect(template)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-sm text-white truncate">{template.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{template.items.length} items</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(template.updatedAt)}
                </span>
              </p>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(template.id)}
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/20 h-7 w-7 p-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}

        {filteredTemplates.length === 0 && search && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No se encontraron plantillas
          </p>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar plantilla</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            ¿Estas seguro que deseas eliminar esta plantilla? Esta accion no se
            puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Modal to save current invoice as template
interface GuardarPlantillaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoDte: '01' | '03';
  items: Array<{
    codigo?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    esGravado: boolean;
    esExento: boolean;
    descuento: number;
    subtotal: number;
    iva: number;
    total: number;
  }>;
  condicionPago: string;
  cliente?: {
    nombre: string;
    numDocumento: string;
    tipoDocumento: string;
  };
}

export function GuardarPlantillaModal({
  open,
  onOpenChange,
  tipoDte,
  items,
  condicionPago,
  cliente,
}: GuardarPlantillaModalProps) {
  const { addTemplate } = useTemplatesStore();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [includeClient, setIncludeClient] = React.useState(false);

  const handleSave = () => {
    if (!name.trim()) return;

    addTemplate({
      name: name.trim(),
      description: description.trim() || undefined,
      tipoDte,
      cliente: includeClient && cliente ? {
        nombre: cliente.nombre,
        numDocumento: cliente.numDocumento,
        tipoDocumento: cliente.tipoDocumento as '36' | '13' | '02' | '03' | '37',
      } : undefined,
      items: items.map(({ codigo, descripcion, cantidad, precioUnitario, esGravado, esExento, descuento, subtotal, iva, total }) => ({
        codigo,
        descripcion,
        cantidad,
        precioUnitario,
        esGravado,
        esExento,
        descuento,
        subtotal,
        iva,
        total,
      })),
      condicionPago,
    });

    setName('');
    setDescription('');
    setIncludeClient(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="w-5 h-5 text-primary" />
            Guardar como plantilla
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Nombre de la plantilla *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Factura mensual servicios"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Descripcion (opcional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Para clientes de mantenimiento"
            />
          </div>

          {cliente && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeClient}
                onChange={(e) => setIncludeClient(e.target.checked)}
                className="rounded border-muted-foreground/50"
              />
              <span className="text-sm">
                Incluir cliente ({cliente.nombre})
              </span>
            </label>
          )}

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Esta plantilla incluira:
            </p>
            <ul className="text-xs space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {items.length} producto(s)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Tipo: {tipoDte === '01' ? 'Factura' : 'CCF'}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Condicion: {condicionPago}
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Guardar plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
