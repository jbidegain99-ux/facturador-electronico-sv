'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpCircle, MessageSquare, Loader2 } from 'lucide-react';
import { EmailRequestType, EmailProvider, EMAIL_PROVIDERS } from '@/types/email-config';

interface AssistanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AssistanceFormData) => Promise<void>;
}

export interface AssistanceFormData {
  requestType: EmailRequestType;
  desiredProvider?: EmailProvider;
  currentProvider?: string;
  accountEmail?: string;
  additionalNotes?: string;
}

const REQUEST_TYPES: { id: EmailRequestType; label: string; description: string }[] = [
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

export function AssistanceModal({
  open,
  onOpenChange,
  onSubmit,
}: AssistanceModalProps) {
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<AssistanceFormData>({
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
    setFormData({ requestType: 'NEW_SETUP' });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Solicitar Asistencia
          </DialogTitle>
          <DialogDescription>
            El equipo de Republicode le ayudará a configurar su servicio de email
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {step === 1 && (
            <Step1RequestType
              selected={formData.requestType}
              onSelect={(requestType) => setFormData({ ...formData, requestType })}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <Step2Details
              formData={formData}
              onChange={(data) => setFormData({ ...formData, ...data })}
              onBack={() => setStep(1)}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Step1RequestType({
  selected,
  onSelect,
  onNext,
}: {
  selected: EmailRequestType;
  onSelect: (type: EmailRequestType) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        ¿Qué tipo de ayuda necesita?
      </p>

      <div className="space-y-2">
        {REQUEST_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            className={`w-full p-4 rounded-lg border text-left transition-all ${
              selected === type.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="font-medium">{type.label}</p>
            <p className="text-sm text-muted-foreground">{type.description}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>Siguiente</Button>
      </div>
    </div>
  );
}

function Step2Details({
  formData,
  onChange,
  onBack,
  onSubmit,
  submitting,
}: {
  formData: AssistanceFormData;
  onChange: (data: Partial<AssistanceFormData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Proporcione información adicional para ayudarle mejor
      </p>

      {/* Current provider */}
      <div className="space-y-2">
        <Label>
          ¿Qué servicio de email usa actualmente? (opcional)
        </Label>
        <Input
          placeholder="Ej: Gmail, Outlook, ninguno"
          value={formData.currentProvider || ''}
          onChange={(e) => onChange({ currentProvider: e.target.value })}
        />
      </div>

      {/* Preferred provider */}
      <div className="space-y-2">
        <Label>
          ¿Tiene preferencia de proveedor? (opcional)
        </Label>
        <select
          className="w-full px-3 py-2 rounded-md border bg-background"
          value={formData.desiredProvider || ''}
          onChange={(e) =>
            onChange({ desiredProvider: e.target.value as EmailProvider || undefined })
          }
        >
          <option value="">Sin preferencia</option>
          {EMAIL_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Account email */}
      <div className="space-y-2">
        <Label>
          Email de contacto (opcional)
        </Label>
        <Input
          type="email"
          placeholder="contacto@empresa.com"
          value={formData.accountEmail || ''}
          onChange={(e) => onChange({ accountEmail: e.target.value })}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>
          Notas adicionales (opcional)
        </Label>
        <textarea
          className="w-full px-3 py-2 rounded-md border bg-background resize-none"
          rows={3}
          placeholder="Describa su situación o cualquier detalle relevante..."
          value={formData.additionalNotes || ''}
          onChange={(e) => onChange({ additionalNotes: e.target.value })}
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Atrás
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4 mr-2" />
              Enviar Solicitud
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Trigger button to open the modal
export function AssistanceButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors"
    >
      <div className="flex items-center justify-center gap-3">
        <div className="p-2 rounded-full bg-primary/20">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left">
          <p className="font-medium text-foreground">¿Necesita ayuda?</p>
          <p className="text-sm text-muted-foreground">
            Solicite asistencia del equipo de Republicode
          </p>
        </div>
      </div>
    </button>
  );
}
