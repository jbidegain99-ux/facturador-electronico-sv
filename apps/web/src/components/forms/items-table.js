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
const table_1 = require("@/components/ui/table");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const money_input_1 = require("./money-input");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const IVA_RATE = 0.13;
function ItemsTable({ items, onAddItem, onUpdateItem, onRemoveItem, ivaRate = IVA_RATE, }) {
    const [newItem, setNewItem] = React.useState({
        codigo: '',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
    });
    const calculateItemTotals = (cantidad, precioUnitario, esGravado) => {
        const subtotal = cantidad * precioUnitario;
        const iva = esGravado ? subtotal * ivaRate : 0;
        const total = subtotal + iva;
        return { subtotal, iva, total };
    };
    const handleAddItem = () => {
        if (!newItem.descripcion || newItem.precioUnitario <= 0)
            return;
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
    const handleUpdateQuantity = (id, cantidad) => {
        const item = items.find((i) => i.id === id);
        if (item) {
            const totals = calculateItemTotals(cantidad, item.precioUnitario, item.esGravado);
            onUpdateItem(id, { cantidad, ...totals });
        }
    };
    const handleUpdatePrice = (id, precioUnitario) => {
        const item = items.find((i) => i.id === id);
        if (item) {
            const totals = calculateItemTotals(item.cantidad, precioUnitario, item.esGravado);
            onUpdateItem(id, { precioUnitario, ...totals });
        }
    };
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalIva = items.reduce((sum, item) => sum + item.iva, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    return (<div className="space-y-4">
      <table_1.Table>
        <table_1.TableHeader>
          <table_1.TableRow>
            <table_1.TableHead className="w-24">Codigo</table_1.TableHead>
            <table_1.TableHead>Descripcion</table_1.TableHead>
            <table_1.TableHead className="w-24 text-right">Cantidad</table_1.TableHead>
            <table_1.TableHead className="w-32 text-right">Precio Unit.</table_1.TableHead>
            <table_1.TableHead className="w-32 text-right">Subtotal</table_1.TableHead>
            <table_1.TableHead className="w-28 text-right">IVA</table_1.TableHead>
            <table_1.TableHead className="w-32 text-right">Total</table_1.TableHead>
            <table_1.TableHead className="w-12"></table_1.TableHead>
          </table_1.TableRow>
        </table_1.TableHeader>
        <table_1.TableBody>
          {items.map((item) => (<table_1.TableRow key={item.id}>
              <table_1.TableCell className="font-mono text-sm">{item.codigo || '-'}</table_1.TableCell>
              <table_1.TableCell>{item.descripcion}</table_1.TableCell>
              <table_1.TableCell>
                <input_1.Input type="number" min="1" value={item.cantidad} onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)} className="w-20 text-right"/>
              </table_1.TableCell>
              <table_1.TableCell>
                <money_input_1.MoneyInput value={item.precioUnitario} onChange={(val) => handleUpdatePrice(item.id, val)} className="w-28"/>
              </table_1.TableCell>
              <table_1.TableCell className="text-right font-medium">{(0, utils_1.formatCurrency)(item.subtotal)}</table_1.TableCell>
              <table_1.TableCell className="text-right text-muted-foreground">{(0, utils_1.formatCurrency)(item.iva)}</table_1.TableCell>
              <table_1.TableCell className="text-right font-semibold">{(0, utils_1.formatCurrency)(item.total)}</table_1.TableCell>
              <table_1.TableCell>
                <button_1.Button variant="ghost" size="icon" onClick={() => onRemoveItem(item.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                  <lucide_react_1.Trash2 className="h-4 w-4"/>
                </button_1.Button>
              </table_1.TableCell>
            </table_1.TableRow>))}

          {/* Add new item row */}
          <table_1.TableRow className="bg-muted/50">
            <table_1.TableCell>
              <input_1.Input placeholder="Codigo" value={newItem.codigo} onChange={(e) => setNewItem({ ...newItem, codigo: e.target.value })} className="w-20"/>
            </table_1.TableCell>
            <table_1.TableCell>
              <input_1.Input placeholder="Descripcion del producto o servicio" value={newItem.descripcion} onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })}/>
            </table_1.TableCell>
            <table_1.TableCell>
              <input_1.Input type="number" min="1" value={newItem.cantidad} onChange={(e) => setNewItem({ ...newItem, cantidad: parseInt(e.target.value) || 1 })} className="w-20 text-right"/>
            </table_1.TableCell>
            <table_1.TableCell>
              <money_input_1.MoneyInput value={newItem.precioUnitario} onChange={(val) => setNewItem({ ...newItem, precioUnitario: val })} className="w-28"/>
            </table_1.TableCell>
            <table_1.TableCell colSpan={3}></table_1.TableCell>
            <table_1.TableCell>
              <button_1.Button variant="ghost" size="icon" onClick={handleAddItem} disabled={!newItem.descripcion || newItem.precioUnitario <= 0} className="h-8 w-8">
                <lucide_react_1.Plus className="h-4 w-4"/>
              </button_1.Button>
            </table_1.TableCell>
          </table_1.TableRow>
        </table_1.TableBody>
      </table_1.Table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>{(0, utils_1.formatCurrency)(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA (13%):</span>
            <span>{(0, utils_1.formatCurrency)(totalIva)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-2">
            <span>Total:</span>
            <span>{(0, utils_1.formatCurrency)(total)}</span>
          </div>
        </div>
      </div>
    </div>);
}
