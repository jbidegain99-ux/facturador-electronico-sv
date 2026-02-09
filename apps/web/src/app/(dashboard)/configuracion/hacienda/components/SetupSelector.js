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
exports.SetupSelector = SetupSelector;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const utils_1 = require("@/lib/utils");
function SetupSelector({ onSelectQuickSetup, onSelectFullWizard }) {
    return (<div className="min-h-[500px] flex items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20">
            <lucide_react_1.Building2 className="h-8 w-8 text-purple-400"/>
          </div>
          <h1 className="text-3xl font-bold">Configuracion con Ministerio de Hacienda</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cual es tu situacion actual con la facturacion electronica?
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1: First Time */}
          <OptionCard icon={<lucide_react_1.Sparkles className="h-8 w-8"/>} title="Primera Vez" description="Nunca he configurado facturacion electronica con Hacienda. Necesito solicitar ambiente de pruebas y generar mi certificado." duration="5-10 dias" buttonText="Proceso completo" onClick={onSelectFullWizard} variant="secondary"/>

          {/* Option 2: Have Credentials */}
          <OptionCard icon={<lucide_react_1.FileKey2 className="h-8 w-8"/>} title="Ya Tengo Credenciales" description="Ya complete el proceso con Hacienda y tengo mi certificado .p12 y credenciales de API. Solo necesito configurarlas en el sistema." duration="5 minutos" buttonText="Configuracion rapida" onClick={onSelectQuickSetup} variant="primary" highlighted/>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            No estas seguro? Si vienes de otro proveedor (Gosocket, ContaPortable, etc.)
            o ya tienes un archivo .p12, selecciona <strong>Ya Tengo Credenciales</strong>.
          </p>
        </div>
      </div>
    </div>);
}
function OptionCard({ icon, title, description, duration, buttonText, onClick, variant, highlighted, }) {
    return (<card_1.Card variant="glass" className={(0, utils_1.cn)('relative overflow-hidden transition-all duration-200 hover:border-primary/50', highlighted && 'ring-2 ring-primary/30')}>
      {highlighted && (<div className="absolute top-0 right-0 px-3 py-1 bg-primary text-xs font-medium text-primary-foreground rounded-bl-lg">
          Recomendado
        </div>)}
      <card_1.CardContent className="p-6 space-y-6">
        {/* Icon */}
        <div className={(0, utils_1.cn)('w-14 h-14 rounded-xl flex items-center justify-center', variant === 'primary' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
          {icon}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed min-h-[60px]">
            {description}
          </p>
        </div>

        {/* Duration Badge */}
        <div className="flex items-center gap-2 text-sm">
          <lucide_react_1.Clock className="h-4 w-4 text-muted-foreground"/>
          <span className="text-muted-foreground">Tiempo estimado:</span>
          <span className={(0, utils_1.cn)('font-medium', variant === 'primary' ? 'text-green-500' : 'text-amber-500')}>
            {duration}
          </span>
        </div>

        {/* Action Button */}
        <button_1.Button onClick={onClick} className="w-full" variant={variant === 'primary' ? 'default' : 'secondary'}>
          {buttonText}
          <lucide_react_1.ChevronRight className="h-4 w-4 ml-2"/>
        </button_1.Button>
      </card_1.CardContent>
    </card_1.Card>);
}
