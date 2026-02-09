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
exports.TotalesCard = TotalesCard;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const select_1 = require("@/components/ui/select");
const utils_1 = require("@/lib/utils");
const CONDICIONES_PAGO = [
    { value: '01', label: 'Contado' },
    { value: '02', label: 'A crédito' },
    { value: '03', label: 'Otro' },
];
function TotalesCard({ items, condicionPago, onCondicionPagoChange, disabled = false, }) {
    // Calculate totals
    const subtotalGravado = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDescuentos = items.reduce((sum, item) => sum + item.descuento, 0);
    const subtotalNeto = subtotalGravado;
    const totalIva = items.reduce((sum, item) => sum + item.iva, 0);
    const totalPagar = items.reduce((sum, item) => sum + item.total, 0);
    const [prevTotal, setPrevTotal] = React.useState(totalPagar);
    const [isAnimating, setIsAnimating] = React.useState(false);
    // Animate when total changes
    React.useEffect(() => {
        if (totalPagar !== prevTotal) {
            setIsAnimating(true);
            setPrevTotal(totalPagar);
            const timeout = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [totalPagar, prevTotal]);
    return (<div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <lucide_react_1.Calculator className="w-5 h-5 text-primary"/>
        <h3 className="font-semibold text-foreground">Resumen</h3>
      </div>

      {/* Totals breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal (gravado):</span>
          <span className="text-foreground font-medium">{(0, utils_1.formatCurrency)(subtotalGravado)}</span>
        </div>

        {totalDescuentos > 0 && (<div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Descuentos:</span>
            <span className="text-warning font-medium">-{(0, utils_1.formatCurrency)(totalDescuentos)}</span>
          </div>)}

        <div className="h-px bg-border"/>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sub-total:</span>
          <span className="text-foreground font-medium">{(0, utils_1.formatCurrency)(subtotalNeto)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">IVA (13%):</span>
          <span className="text-foreground font-medium">{(0, utils_1.formatCurrency)(totalIva)}</span>
        </div>

        <div className="h-px bg-primary/30"/>

        {/* Total to pay */}
        <div className="flex justify-between items-center pt-1">
          <span className="text-lg font-semibold text-foreground">TOTAL A PAGAR:</span>
          <span className={(0, utils_1.cn)('text-2xl font-bold text-primary transition-all duration-300', isAnimating && 'scale-110')}>
            {(0, utils_1.formatCurrency)(totalPagar)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border"/>

      {/* Payment condition */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Condicion de pago:</label>
        <select_1.Select value={condicionPago} onValueChange={onCondicionPagoChange} disabled={disabled}>
          <select_1.SelectTrigger className="w-full input-rc">
            <select_1.SelectValue placeholder="Seleccionar condicion"/>
          </select_1.SelectTrigger>
          <select_1.SelectContent>
            {CONDICIONES_PAGO.map((condicion) => (<select_1.SelectItem key={condicion.value} value={condicion.value}>
                {condicion.label}
              </select_1.SelectItem>))}
          </select_1.SelectContent>
        </select_1.Select>
      </div>

      {/* Items count */}
      {items.length > 0 && (<div className="pt-2 text-center">
          <span className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'} en la factura
          </span>
        </div>)}
    </div>);
}
