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
exports.DteSelectionStep = DteSelectionStep;
const React = __importStar(require("react"));
const button_1 = require("@/components/ui/button");
const checkbox_1 = require("@/components/ui/checkbox");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const alert_1 = require("@/components/ui/alert");
const onboarding_1 = require("@/types/onboarding");
const ALL_DTE_TYPES = [
    'FACTURA',
    'CREDITO_FISCAL',
    'NOTA_REMISION',
    'NOTA_CREDITO',
    'NOTA_DEBITO',
    'COMPROBANTE_RETENCION',
    'COMPROBANTE_LIQUIDACION',
    'DOCUMENTO_CONTABLE_LIQUIDACION',
    'FACTURA_EXPORTACION',
    'FACTURA_SUJETO_EXCLUIDO',
    'COMPROBANTE_DONACION',
];
// Tests required per DTE type
const TESTS_REQUIRED = {
    FACTURA: 5,
    CREDITO_FISCAL: 3,
    NOTA_REMISION: 2,
    NOTA_CREDITO: 2,
    NOTA_DEBITO: 2,
    COMPROBANTE_RETENCION: 2,
    COMPROBANTE_LIQUIDACION: 2,
    DOCUMENTO_CONTABLE_LIQUIDACION: 1,
    FACTURA_EXPORTACION: 2,
    FACTURA_SUJETO_EXCLUIDO: 2,
    COMPROBANTE_DONACION: 1,
};
// Common document types that most businesses need
const COMMON_TYPES = [
    'FACTURA',
    'CREDITO_FISCAL',
    'NOTA_CREDITO',
    'NOTA_DEBITO',
];
function DteSelectionStep({ selectedTypes = [], onSubmit, onBack, loading, }) {
    const [selected, setSelected] = React.useState(() => {
        if (selectedTypes.length > 0) {
            return new Set(selectedTypes.map((t) => t.dteType));
        }
        // Pre-select common types
        return new Set(COMMON_TYPES);
    });
    const toggleType = (type) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(type)) {
                next.delete(type);
            }
            else {
                next.add(type);
            }
            return next;
        });
    };
    const selectAll = () => {
        setSelected(new Set(ALL_DTE_TYPES));
    };
    const selectCommon = () => {
        setSelected(new Set(COMMON_TYPES));
    };
    const clearAll = () => {
        setSelected(new Set());
    };
    const handleSubmit = () => {
        if (selected.size === 0)
            return;
        const types = Array.from(selected).map((dteType) => ({
            dteType,
            isRequired: COMMON_TYPES.includes(dteType),
        }));
        onSubmit(types);
    };
    const totalTests = Array.from(selected).reduce((sum, type) => sum + TESTS_REQUIRED[type], 0);
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <lucide_react_1.FileText className="h-6 w-6 text-primary"/>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Tipos de DTE a Emitir</h2>
          <p className="text-muted-foreground">
            Seleccione los documentos tributarios que necesita emitir
          </p>
        </div>
      </div>

      {/* Info */}
      <alert_1.Alert>
        <lucide_react_1.Info className="h-4 w-4"/>
        <alert_1.AlertDescription>
          Cada tipo de documento requiere un número específico de pruebas
          exitosas antes de poder solicitar la autorización. El total de pruebas
          dependerá de los tipos seleccionados.
        </alert_1.AlertDescription>
      </alert_1.Alert>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <button_1.Button variant="outline" size="sm" onClick={selectCommon}>
          Documentos Comunes
        </button_1.Button>
        <button_1.Button variant="outline" size="sm" onClick={selectAll}>
          Seleccionar Todos
        </button_1.Button>
        <button_1.Button variant="outline" size="sm" onClick={clearAll}>
          Limpiar Selección
        </button_1.Button>
      </div>

      {/* DTE types grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_DTE_TYPES.map((type) => {
            const info = onboarding_1.DTE_TYPE_INFO[type];
            const isSelected = selected.has(type);
            const isCommon = COMMON_TYPES.includes(type);
            return (<card_1.Card key={type} className={`cursor-pointer transition-all ${isSelected
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'}`} onClick={() => toggleType(type)}>
              <card_1.CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <checkbox_1.Checkbox checked={isSelected} onCheckedChange={() => toggleType(type)} className="mt-1"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label_1.Label className="font-medium cursor-pointer">
                        {info.name}
                      </label_1.Label>
                      {isCommon && (<badge_1.Badge variant="secondary" className="text-xs">
                          Común
                        </badge_1.Badge>)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {info.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {TESTS_REQUIRED[type]} pruebas requeridas
                    </p>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>);
        })}
      </div>

      {/* Summary */}
      <card_1.Card className="bg-muted/50">
        <card_1.CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Resumen de Selección</p>
              <p className="text-sm text-muted-foreground">
                {selected.size} tipo(s) de documento seleccionado(s)
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{totalTests}</p>
              <p className="text-sm text-muted-foreground">pruebas totales</p>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button_1.Button type="button" variant="outline" onClick={onBack}>
          <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
          Anterior
        </button_1.Button>
        <button_1.Button onClick={handleSubmit} disabled={loading || selected.size === 0}>
          {loading ? (<>
              <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              Guardando...
            </>) : (<>
              Continuar
              <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
            </>)}
        </button_1.Button>
      </div>

      {selected.size === 0 && (<p className="text-center text-sm text-red-500">
          Debe seleccionar al menos un tipo de documento
        </p>)}
    </div>);
}
