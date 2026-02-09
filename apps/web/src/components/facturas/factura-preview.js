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
exports.FacturaPreview = FacturaPreview;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const utils_1 = require("@/lib/utils");
const CONDICIONES_PAGO = {
    '01': 'Contado',
    '02': 'A crédito',
    '03': 'Otro',
};
function FacturaPreview({ open, onClose, onEmit, data, isEmitting, }) {
    const { tipoDte, cliente, items, condicionPago, emisor } = data;
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDescuento = items.reduce((sum, item) => sum + item.descuento, 0);
    const totalIva = items.reduce((sum, item) => sum + item.iva, 0);
    const totalPagar = items.reduce((sum, item) => sum + item.total, 0);
    const fechaActual = new Date();
    return (<dialog_1.Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <dialog_1.DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-[#0f0f1a] border-border">
        <dialog_1.DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <lucide_react_1.FileText className="w-5 h-5 text-primary"/>
              </div>
              <div>
                <dialog_1.DialogTitle className="text-lg text-white">Vista Previa de Factura</dialog_1.DialogTitle>
                <dialog_1.DialogDescription>
                  Revisa los datos antes de emitir
                </dialog_1.DialogDescription>
              </div>
            </div>
            <badge_1.Badge className={(0, utils_1.cn)(tipoDte === '01' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary')}>
              {(0, utils_1.getTipoDteName)(tipoDte)}
            </badge_1.Badge>
          </div>
        </dialog_1.DialogHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] py-4 space-y-6">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <lucide_react_1.Calendar className="w-4 h-4"/>
                <span>Fecha:</span>
              </div>
              <p className="text-white font-medium pl-6">{(0, utils_1.formatDate)(fechaActual)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <lucide_react_1.Clock className="w-4 h-4"/>
                <span>Hora:</span>
              </div>
              <p className="text-white font-medium pl-6">
                {fechaActual.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <lucide_react_1.Hash className="w-4 h-4"/>
                <span>Numero de Control:</span>
              </div>
              <p className="text-white font-medium pl-6 font-mono text-xs">
                (Se generara al emitir)
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Condicion:</span>
              </div>
              <p className="text-white font-medium pl-6">
                {CONDICIONES_PAGO[condicionPago] || condicionPago}
              </p>
            </div>
          </div>

          {/* Emisor (if available) */}
          {emisor && (<div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <lucide_react_1.Building2 className="w-4 h-4 text-muted-foreground"/>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Emisor
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-white">{emisor.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  NIT: {emisor.nit} | NRC: {emisor.nrc}
                </p>
                {emisor.direccion && (<p className="text-sm text-muted-foreground">{emisor.direccion}</p>)}
              </div>
            </div>)}

          {/* Receptor/Cliente */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <lucide_react_1.User className="w-4 h-4 text-muted-foreground"/>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Receptor
              </span>
            </div>
            {cliente ? (<div className="space-y-1">
                <p className="font-semibold text-white">{cliente.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {cliente.tipoDocumento === '36' ? 'NIT' : 'DUI'}: {cliente.numDocumento}
                  {cliente.nrc && ` | NRC: ${cliente.nrc}`}
                </p>
                {cliente.correo && (<p className="text-sm text-muted-foreground">{cliente.correo}</p>)}
              </div>) : (<p className="text-warning">Consumidor Final (sin identificar)</p>)}
          </div>

          {/* Items table */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-white/5">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Detalle de Items ({items.length})
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Descripcion</th>
                    <th className="px-4 py-2 text-right">Cant.</th>
                    <th className="px-4 py-2 text-right">P. Unit.</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (<tr key={item.id} className="border-b border-border/50">
                      <td className="px-4 py-2 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-2 text-white">{item.descripcion}</td>
                      <td className="px-4 py-2 text-right text-white">{item.cantidad}</td>
                      <td className="px-4 py-2 text-right text-white">
                        {(0, utils_1.formatCurrency)(item.precioUnitario)}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-white">
                        {(0, utils_1.formatCurrency)(item.subtotal)}
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="glass-card p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-white">{(0, utils_1.formatCurrency)(subtotal)}</span>
              </div>
              {totalDescuento > 0 && (<div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuentos:</span>
                  <span className="text-warning">-{(0, utils_1.formatCurrency)(totalDescuento)}</span>
                </div>)}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (13%):</span>
                <span className="text-white">{(0, utils_1.formatCurrency)(totalIva)}</span>
              </div>
              <div className="h-px bg-primary/30 my-2"/>
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-white">TOTAL A PAGAR:</span>
                <span className="text-xl font-bold text-primary">{(0, utils_1.formatCurrency)(totalPagar)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <dialog_1.DialogFooter className="border-t border-border pt-4 gap-2">
          <button_1.Button variant="ghost" onClick={onClose} disabled={isEmitting} className="btn-secondary">
            Cancelar
          </button_1.Button>
          <button_1.Button onClick={onEmit} disabled={isEmitting || items.length === 0} className="btn-primary">
            {isEmitting ? (<>
                <lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                Emitiendo...
              </>) : (<>
                <lucide_react_1.Send className="w-4 h-4 mr-2"/>
                Emitir Factura
              </>)}
          </button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
