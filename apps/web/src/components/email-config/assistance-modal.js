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
exports.AssistanceModal = AssistanceModal;
exports.AssistanceButton = AssistanceButton;
const React = __importStar(require("react"));
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const lucide_react_1 = require("lucide-react");
const email_config_1 = require("@/types/email-config");
const REQUEST_TYPES = [
    {
        id: 'NEW_SETUP',
        label: 'Nueva configuración',
        description: 'No tengo un servicio de email y necesito ayuda para configurar uno',
    },
    {
        id: 'MIGRATION',
        label: 'Migración',
        description: 'Quiero migrar de mi proveedor actual a otro',
    },
    {
        id: 'CONFIGURATION_HELP',
        label: 'Ayuda con configuración',
        description: 'Ya tengo un servicio pero necesito ayuda para configurarlo',
    },
    {
        id: 'TROUBLESHOOTING',
        label: 'Problemas técnicos',
        description: 'Mi configuración no está funcionando correctamente',
    },
];
function AssistanceModal({ open, onOpenChange, onSubmit, }) {
    const [step, setStep] = React.useState(1);
    const [submitting, setSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState({
        requestType: 'NEW_SETUP',
    });
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onSubmit(formData);
            onOpenChange(false);
            // Reset form
            setStep(1);
            setFormData({ requestType: 'NEW_SETUP' });
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleClose = () => {
        onOpenChange(false);
        setStep(1);
        setFormData({ requestType: 'NEW_SETUP' });
    };
    return (<dialog_1.Dialog open={open} onOpenChange={handleClose}>
      <dialog_1.DialogContent className="sm:max-w-[500px]">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle className="flex items-center gap-2">
            <lucide_react_1.HelpCircle className="h-5 w-5 text-primary"/>
            Solicitar Asistencia
          </dialog_1.DialogTitle>
          <dialog_1.DialogDescription>
            El equipo de Republicode le ayudará a configurar su servicio de email
          </dialog_1.DialogDescription>
        </dialog_1.DialogHeader>

        <div className="mt-4">
          {step === 1 && (<Step1RequestType selected={formData.requestType} onSelect={(requestType) => setFormData({ ...formData, requestType })} onNext={() => setStep(2)}/>)}

          {step === 2 && (<Step2Details formData={formData} onChange={(data) => setFormData({ ...formData, ...data })} onBack={() => setStep(1)} onSubmit={handleSubmit} submitting={submitting}/>)}
        </div>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
function Step1RequestType({ selected, onSelect, onNext, }) {
    return (<div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        ¿Qué tipo de ayuda necesita?
      </p>

      <div className="space-y-2">
        {REQUEST_TYPES.map((type) => (<button key={type.id} type="button" onClick={() => onSelect(type.id)} className={`w-full p-4 rounded-lg border text-left transition-all ${selected === type.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'}`}>
            <p className="font-medium">{type.label}</p>
            <p className="text-sm text-muted-foreground">{type.description}</p>
          </button>))}
      </div>

      <div className="flex justify-end">
        <button_1.Button onClick={onNext}>Siguiente</button_1.Button>
      </div>
    </div>);
}
function Step2Details({ formData, onChange, onBack, onSubmit, submitting, }) {
    return (<div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Proporcione información adicional para ayudarle mejor
      </p>

      {/* Current provider */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          ¿Qué servicio de email usa actualmente? (opcional)
        </label>
        <input_1.Input placeholder="Ej: Gmail, Outlook, ninguno" value={formData.currentProvider || ''} onChange={(e) => onChange({ currentProvider: e.target.value })}/>
      </div>

      {/* Preferred provider */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          ¿Tiene preferencia de proveedor? (opcional)
        </label>
        <select className="w-full px-3 py-2 rounded-md border bg-background" value={formData.desiredProvider || ''} onChange={(e) => onChange({ desiredProvider: e.target.value || undefined })}>
          <option value="">Sin preferencia</option>
          {email_config_1.EMAIL_PROVIDERS.map((p) => (<option key={p.id} value={p.id}>
              {p.name}
            </option>))}
        </select>
      </div>

      {/* Account email */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Email de contacto (opcional)
        </label>
        <input_1.Input type="email" placeholder="contacto@empresa.com" value={formData.accountEmail || ''} onChange={(e) => onChange({ accountEmail: e.target.value })}/>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Notas adicionales (opcional)
        </label>
        <textarea className="w-full px-3 py-2 rounded-md border bg-background resize-none" rows={3} placeholder="Describa su situación o cualquier detalle relevante..." value={formData.additionalNotes || ''} onChange={(e) => onChange({ additionalNotes: e.target.value })}/>
      </div>

      <div className="flex justify-between pt-2">
        <button_1.Button variant="ghost" onClick={onBack} disabled={submitting}>
          Atrás
        </button_1.Button>
        <button_1.Button onClick={onSubmit} disabled={submitting}>
          {submitting ? (<>
              <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>
              Enviando...
            </>) : (<>
              <lucide_react_1.MessageSquare className="h-4 w-4 mr-2"/>
              Enviar Solicitud
            </>)}
        </button_1.Button>
      </div>
    </div>);
}
// Trigger button to open the modal
function AssistanceButton({ onClick }) {
    return (<button onClick={onClick} className="w-full p-4 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors">
      <div className="flex items-center justify-center gap-3">
        <div className="p-2 rounded-full bg-primary/20">
          <lucide_react_1.HelpCircle className="h-5 w-5 text-primary"/>
        </div>
        <div className="text-left">
          <p className="font-medium text-foreground">¿Necesita ayuda?</p>
          <p className="text-sm text-muted-foreground">
            Solicite asistencia del equipo de Republicode
          </p>
        </div>
      </div>
    </button>);
}
