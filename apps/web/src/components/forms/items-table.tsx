'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from './money-input';
import { ItemFactura } from '@/types';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ItemsTableProps {
  items: ItemFactura[];
  onAddItem: (item: ItemFactura) => void;
  onUpdateItem: (id: string, item: Partial<ItemFactura>) => void;
  onRemoveItem: (id: string) => void;
  ivaRate?: number;
}

const IVA_RATE = 0.13;

export function ItemsTable({
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  ivaRate = IVA_RATE,
}: ItemsTableProps) {
  const [newItem, setNewItem] = React.useState({
    codigo: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
  });

  const calculateItemTotals = (cantidad: number, precioUnitario: number, esGravado: boolean) => {
    const subtotal = cantidad * precioUnitario;
    const iva = esGravado ? subtotal * ivaRate : 0;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const handleAddItem = () => {
    if (!newItem.descripcion || newItem.precioUnitario <= 0) return;

    const totals = calculateItemTotals(newItem.cantidad, newItem.precioUnitario, true);

    onAddItem({
      id: crypto.randomUUID(),
      codigo: newItem.codigo || undefined,
      descripcion: newItem.descripcion,
      cantidad: newItem.cantidad,
      precioUnitario: newItem.precioUnitario,
      esGravado: true,
      esExento: false,
      descuento: 0,
      ...totals,
    });

    setNewItem({ codigo: '', descripcion: '', cantidad: 1, precioUnitario: 0 });
  };

  const handleUpdateQuantity = (id: string, cantidad: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      const totals = calculateItemTotals(cantidad, item.precioUnitario, item.esGravado);
      onUpdateItem(id, { cantidad, ...totals });
    }
  };

  const handleUpdatePrice = (id: string, precioUnitario: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      const totals = calculateItemTotals(item.cantidad, precioUnitario, item.esGravado);
      onUpdateItem(id, { precioUnitario, ...totals });
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalIva = items.reduce((sum, item) => sum + item.iva, 0);
  const total = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Codigo</TableHead>
            <TableHead>Descripcion</TableHead>
            <TableHead className="w-24 text-right">Cantidad</TableHead>
            <TableHead className="w-32 text-right">Precio Unit.</TableHead>
            <TableHead className="w-32 text-right">Subtotal</TableHead>
            <TableHead className="w-28 text-right">IVA</TableHead>
            <TableHead className="w-32 text-right">Total</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.codigo || '-'}</TableCell>
              <TableCell>{item.descripcion}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  value={item.cantidad}
                  onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                  className="w-20 text-right"
                />
              </TableCell>
              <TableCell>
                <MoneyInput
                  value={item.precioUnitario}
                  onChange={(val) => handleUpdatePrice(item.id, val)}
                  className="w-28"
                />
              </TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatCurrency(item.iva)}</TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveItem(item.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {/* Add new item row */}
          <TableRow className="bg-muted/50">
            <TableCell>
              <Input
                placeholder="Codigo"
                value={newItem.codigo}
                onChange={(e) => setNewItem({ ...newItem, codigo: e.target.value })}
                className="w-20"
              />
            </TableCell>
            <TableCell>
              <Input
                placeholder="Descripcion del producto o servicio"
                value={newItem.descripcion}
                onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })}
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min="1"
                value={newItem.cantidad}
                onChange={(e) => setNewItem({ ...newItem, cantidad: parseInt(e.target.value) || 1 })}
                className="w-20 text-right"
              />
            </TableCell>
            <TableCell>
              <MoneyInput
                value={newItem.precioUnitario}
                onChange={(val) => setNewItem({ ...newItem, precioUnitario: val })}
                className="w-28"
              />
            </TableCell>
            <TableCell colSpan={3}></TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddItem}
                disabled={!newItem.descripcion || newItem.precioUnitario <= 0}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA (13%):</span>
            <span>{formatCurrency(totalIva)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-2">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
