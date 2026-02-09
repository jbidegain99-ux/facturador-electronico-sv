'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsTable = ItemsTable;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const input_1 = require("@/components/ui/input");
const button_1 = require("@/components/ui/button");
const utils_1 = require("@/lib/utils");
const IVA_RATE = 0.13;
function calculateItemTotals(cantidad, precioUnitario, descuento = 0, esGravado = true) {
    const subtotal = cantidad * precioUnitario - descuento;
    const iva = esGravado ? subtotal * IVA_RATE : 0;
    const total = subtotal + iva;
    return { subtotal, iva, total };
}
function ItemsTable({ items, onChange, disabled = false }) {
    const [newItem, setNewItem] = React.useState({
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
    });
    const [editingField, setEditingField] = React.useState(null);
    const [deletedItem, setDeletedItem] = React.useState(null);
    const [showUndo, setShowUndo] = React.useState(false);
    const inputRef = React.useRef(null);
    const undoTimeoutRef = React.useRef(null);
    // Focus input on mount
    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);
    const handleAddItem = () => {
        if (!newItem.descripcion.trim() || newItem.precioUnitario <= 0)
            return;
        const totals = calculateItemTotals(newItem.cantidad, newItem.precioUnitario, 0, true);
        const item = {
            id: crypto.randomUUID(),
            descripcion: newItem.descripcion.trim(),
            cantidad: newItem.cantidad,
            precioUnitario: newItem.precioUnitario,
            esGravado: true,
            esExento: false,
            descuento: 0,
            ...totals,
        };
        onChange([...items, item]);
        setNewItem({ descripcion: '', cantidad: 1, precioUnitario: 0 });
        inputRef.current?.focus();
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddItem();
        }
    };
    const handleUpdateItem = (id, updates) => {
        const updatedItems = items.map((item) => {
            if (item.id !== id)
                return item;
            const newItem = { ...item, ...updates };
            const totals = calculateItemTotals(newItem.cantidad, newItem.precioUnitario, newItem.descuento, newItem.esGravado);
            return { ...newItem, ...totals };
        });
        onChange(updatedItems);
    };
    const handleRemoveItem = (id) => {
        const index = items.findIndex((i) => i.id === id);
        if (index === -1)
            return;
        const itemToRemove = items[index];
        setDeletedItem({ item: itemToRemove, index });
        setShowUndo(true);
        // Clear previous timeout
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
        }
        // Remove item immediately
        onChange(items.filter((i) => i.id !== id));
        // Hide undo after 5 seconds
        undoTimeoutRef.current = setTimeout(() => {
            setShowUndo(false);
            setDeletedItem(null);
        }, 5000);
    };
    const handleUndo = () => {
        if (!deletedItem)
            return;
        const newItems = [...items];
        newItems.splice(deletedItem.index, 0, deletedItem.item);
        onChange(newItems);
        setShowUndo(false);
        setDeletedItem(null);
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
        }
    };
    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
            }
        };
    }, []);
    const totalItems = items.length;
    const subtotalGeneral = items.reduce((sum, i) => sum + i.subtotal, 0);
    return (<div className="space-y-4">
      {/* Add item input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input_1.Input ref={inputRef} value={newItem.descripcion} onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })} onKeyDown={handleKeyDown} placeholder="Escribe la descripcion del producto o servicio y presiona Enter..." className="input-rc" disabled={disabled}/>
        </div>
        <input_1.Input type="number" min="1" value={newItem.cantidad} onChange={(e) => setNewItem({ ...newItem, cantidad: parseInt(e.target.value) || 1 })} onKeyDown={handleKeyDown} className="w-20 input-rc text-center" placeholder="Cant" disabled={disabled}/>
        <div className="relative w-28">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <input_1.Input type="number" min="0" step="0.01" value={newItem.precioUnitario || ''} onChange={(e) => setNewItem({ ...newItem, precioUnitario: parseFloat(e.target.value) || 0 })} onKeyDown={handleKeyDown} className="pl-7 input-rc text-right" placeholder="0.00" disabled={disabled}/>
        </div>
        <button_1.Button onClick={handleAddItem} disabled={disabled || !newItem.descripcion.trim() || newItem.precioUnitario <= 0} className="btn-primary px-4">
          <lucide_react_1.Plus className="w-4 h-4"/>
        </button_1.Button>
      </div>

      {/* Undo toast */}
      {showUndo && deletedItem && (<div className="flex items-center justify-between px-4 py-3 glass-card border-warning/50 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm">
            <lucide_react_1.AlertCircle className="w-4 h-4 text-warning"/>
            <span>
              Item eliminado: <strong>{deletedItem.item.descripcion}</strong>
            </span>
          </div>
          <button_1.Button variant="ghost" size="sm" onClick={handleUndo} className="text-primary">
            Deshacer
          </button_1.Button>
        </div>)}

      {/* Items table */}
      {items.length > 0 ? (<div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Descripcion
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                  Cant.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">
                  P. Unit.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                  Desc.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">
                  Subtotal
                </th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (<tr key={item.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors animate-in fade-in-50 duration-200">
                  <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{item.descripcion}</span>
                    {item.codigo && (<span className="ml-2 text-xs text-muted-foreground font-mono">
                        [{item.codigo}]
                      </span>)}
                  </td>
                  <td className="px-4 py-3">
                    {editingField?.id === item.id && editingField?.field === 'cantidad' ? (<input_1.Input type="number" min="1" value={item.cantidad} onChange={(e) => handleUpdateItem(item.id, { cantidad: parseInt(e.target.value) || 1 })} onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)} className="w-16 text-center h-8 text-sm" autoFocus/>) : (<button onClick={() => setEditingField({ id: item.id, field: 'cantidad' })} className="w-full text-center text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer" disabled={disabled}>
                        {item.cantidad}
                      </button>)}
                  </td>
                  <td className="px-4 py-3">
                    {editingField?.id === item.id && editingField?.field === 'precioUnitario' ? (<input_1.Input type="number" min="0" step="0.01" value={item.precioUnitario} onChange={(e) => handleUpdateItem(item.id, {
                        precioUnitario: parseFloat(e.target.value) || 0,
                    })} onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)} className="w-24 text-right h-8 text-sm" autoFocus/>) : (<button onClick={() => setEditingField({ id: item.id, field: 'precioUnitario' })} className="w-full text-right text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer" disabled={disabled}>
                        {(0, utils_1.formatCurrency)(item.precioUnitario)}
                      </button>)}
                  </td>
                  <td className="px-4 py-3">
                    {editingField?.id === item.id && editingField?.field === 'descuento' ? (<input_1.Input type="number" min="0" step="0.01" value={item.descuento} onChange={(e) => handleUpdateItem(item.id, {
                        descuento: parseFloat(e.target.value) || 0,
                    })} onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)} className="w-20 text-right h-8 text-sm" autoFocus/>) : (<button onClick={() => setEditingField({ id: item.id, field: 'descuento' })} className={(0, utils_1.cn)('w-full text-right text-sm transition-colors cursor-pointer', item.descuento > 0
                        ? 'text-warning font-medium'
                        : 'text-muted-foreground hover:text-primary')} disabled={disabled}>
                        {item.descuento > 0 ? `-${(0, utils_1.formatCurrency)(item.descuento)}` : '$0.00'}
                      </button>)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {(0, utils_1.formatCurrency)(item.subtotal)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button_1.Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} disabled={disabled} className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive">
                      <lucide_react_1.Trash2 className="w-4 h-4"/>
                    </button_1.Button>
                  </td>
                </tr>))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50">
                <td colSpan={5} className="px-4 py-3 text-right text-sm text-muted-foreground">
                  Total items: <span className="font-medium text-foreground">{totalItems}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-primary">
                    {(0, utils_1.formatCurrency)(subtotalGeneral)}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>) : (
        /* Empty state */
        <div className="glass-card py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <lucide_react_1.Package className="w-8 h-8 text-muted-foreground"/>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No hay items en la factura</h3>
          <p className="text-sm text-muted-foreground">
            Escribe una descripcion arriba y presiona Enter para agregar productos
          </p>
        </div>)}
    </div>);
}
