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
exports.EnvironmentStep = EnvironmentStep;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const card_1 = require("@/components/ui/card");
const alert_1 = require("@/components/ui/alert");
const utils_1 = require("@/lib/utils");
function EnvironmentStep({ environment, onSelect }) {
    return (<div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Selecciona el Ambiente</h3>
        <p className="text-muted-foreground">
          Elige el ambiente que deseas configurar primero
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Test Environment */}
        <EnvironmentCard title="Ambiente de Pruebas" description="Para realizar pruebas tecnicas y validar la integracion antes de ir a produccion." icon={<lucide_react_1.FlaskConical className="h-8 w-8"/>} features={[
            'DTEs no tienen validez fiscal',
            'Ideal para pruebas',
            'Token valido por 48 horas',
        ]} selected={environment === 'TEST'} onClick={() => onSelect('TEST')} variant="test"/>

        {/* Production Environment */}
        <EnvironmentCard title="Produccion" description="Ambiente oficial para emitir documentos tributarios electronicos con validez fiscal." icon={<lucide_react_1.Building className="h-8 w-8"/>} features={[
            'DTEs con validez fiscal',
            'Requiere autorizacion de MH',
            'Token valido por 24 horas',
        ]} selected={environment === 'PRODUCTION'} onClick={() => onSelect('PRODUCTION')} variant="production" requiresAuth/>
      </div>

      {/* Info Alert */}
      <alert_1.Alert className="max-w-3xl mx-auto bg-muted/50 border-border">
        <lucide_react_1.Shield className="h-4 w-4"/>
        <alert_1.AlertDescription>
          <strong>Recomendacion:</strong> Si es tu primera vez, comienza con el ambiente de
          pruebas para verificar que todo funciona correctamente antes de pasar a produccion.
        </alert_1.AlertDescription>
      </alert_1.Alert>
    </div>);
}
function EnvironmentCard({ title, description, icon, features, selected, onClick, variant, requiresAuth, }) {
    const colorClasses = {
        test: {
            icon: 'bg-amber-500/20 text-amber-400',
            badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            ring: 'ring-amber-500/50',
            hover: 'hover:border-amber-500/50',
        },
        production: {
            icon: 'bg-emerald-500/20 text-emerald-400',
            badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            ring: 'ring-emerald-500/50',
            hover: 'hover:border-emerald-500/50',
        },
    };
    const colors = colorClasses[variant];
    return (<card_1.Card variant="glass" className={(0, utils_1.cn)('cursor-pointer transition-all duration-200', colors.hover, selected && `ring-2 ${colors.ring}`)} onClick={onClick}>
      <card_1.CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={(0, utils_1.cn)('w-14 h-14 rounded-xl flex items-center justify-center', colors.icon)}>
            {icon}
          </div>
          {requiresAuth && (<div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
              <lucide_react_1.AlertTriangle className="h-3 w-3"/>
              Requiere autorizacion
            </div>)}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h4 className="text-lg font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {features.map((feature, idx) => (<li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={(0, utils_1.cn)('w-1.5 h-1.5 rounded-full', colors.icon.replace('text-', 'bg-').replace('/20', ''))}/>
              {feature}
            </li>))}
        </ul>

        {/* Selection indicator */}
        <div className={(0, utils_1.cn)('w-full h-1 rounded-full transition-all', selected
            ? colors.icon.replace('text-', 'bg-').replace('/20', '')
            : 'bg-muted')}/>
      </card_1.CardContent>
    </card_1.Card>);
}
