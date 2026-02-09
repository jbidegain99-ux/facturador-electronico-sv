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
exports.WelcomeStep = WelcomeStep;
const React = __importStar(require("react"));
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const radio_group_1 = require("@/components/ui/radio-group");
const label_1 = require("@/components/ui/label");
const lucide_react_1 = require("lucide-react");
const ASSISTANCE_OPTIONS = [
    {
        value: 'SELF_SERVICE',
        icon: lucide_react_1.Rocket,
        title: 'Auto-servicio',
        description: 'Realizo el proceso por mi cuenta siguiendo la guía',
        features: [
            'Guía paso a paso interactiva',
            'Documentación completa',
            'Soporte por chat si lo necesito',
        ],
    },
    {
        value: 'GUIDED',
        icon: lucide_react_1.Users,
        title: 'Asistido',
        description: 'Republicode me guía en cada paso',
        features: [
            'Sesión de videollamada inicial',
            'Acompañamiento en pasos clave',
            'Revisión de configuración',
        ],
    },
    {
        value: 'FULL_SERVICE',
        icon: lucide_react_1.Headphones,
        title: 'Servicio Completo',
        description: 'Republicode hace todo por mí',
        features: [
            'Gestión completa del proceso',
            'Solo proporciono información',
            'Soporte prioritario',
        ],
    },
];
function WelcomeStep({ onStart, loading }) {
    const [selectedLevel, setSelectedLevel] = React.useState('SELF_SERVICE');
    return (<div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <lucide_react_1.Rocket className="h-10 w-10 text-primary"/>
        </div>
        <h1 className="text-3xl font-bold">¡Bienvenido al proceso de habilitación!</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Este asistente lo guiará a través de los pasos necesarios para
          convertirse en emisor autorizado de documentos tributarios
          electrónicos en El Salvador.
        </p>
      </div>

      {/* What to expect */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>¿Qué incluye el proceso?</card_1.CardTitle>
          <card_1.CardDescription>
            El proceso de habilitación consta de 12 pasos principales
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
            'Registro de datos de empresa',
            'Verificación de credenciales MH',
            'Selección de tipos de DTE',
            'Configuración de ambiente de pruebas',
            'Ejecución de pruebas técnicas',
            'Solicitud de autorización',
            'Configuración de producción',
            'Validación final',
        ].map((item, i) => (<div key={i} className="flex items-center gap-2">
                <lucide_react_1.CheckCircle2 className="h-4 w-4 text-green-500 shrink-0"/>
                <span className="text-sm">{item}</span>
              </div>))}
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Assistance level selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          ¿Cómo prefiere realizar el proceso?
        </h2>
        <radio_group_1.RadioGroup value={selectedLevel} onValueChange={(v) => setSelectedLevel(v)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ASSISTANCE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (<label_1.Label key={option.value} htmlFor={option.value} className={`
                  flex flex-col p-6 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedLevel === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'}
                `}>
                <radio_group_1.RadioGroupItem value={option.value} id={option.value} className="sr-only"/>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${selectedLevel === option.value
                    ? 'bg-primary text-white'
                    : 'bg-muted'}`}>
                    <Icon className="h-5 w-5"/>
                  </div>
                  <span className="font-semibold">{option.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {option.description}
                </p>
                <ul className="space-y-2 mt-auto">
                  {option.features.map((feature, i) => (<li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <lucide_react_1.CheckCircle2 className="h-3 w-3 text-green-500"/>
                      {feature}
                    </li>))}
                </ul>
              </label_1.Label>);
        })}
        </radio_group_1.RadioGroup>
      </div>

      {/* Start button */}
      <div className="flex justify-center pt-4">
        <button_1.Button size="lg" onClick={() => onStart(selectedLevel)} disabled={loading} className="min-w-[200px]">
          {loading ? ('Iniciando...') : (<>
              Comenzar Proceso
              <lucide_react_1.ArrowRight className="ml-2 h-5 w-5"/>
            </>)}
        </button_1.Button>
      </div>

      {/* Note */}
      <p className="text-center text-sm text-muted-foreground">
        Puede cambiar el nivel de asistencia en cualquier momento durante el
        proceso.
      </p>
    </div>);
}
