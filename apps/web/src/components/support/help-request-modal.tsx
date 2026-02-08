'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCircle, HelpCircle, Loader2 } from 'lucide-react';

interface HelpRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'EMAIL_CONFIG' | 'TECHNICAL' | 'BILLING' | 'GENERAL' | 'ONBOARDING';
  contextData?: Record<string, any>;
}

const ticketTypes = [
  { value: 'EMAIL_CONFIG', label: 'Configuracion de Email', description: 'Ayuda con la configuracion del servicio de correo' },
  { value: 'TECHNICAL', label: 'Problema Tecnico', description: 'Errores, fallas o comportamiento inesperado' },
  { value: 'BILLING', label: 'Facturacion', description: 'Preguntas sobre planes, pagos o limites' },
  { value: 'GENERAL', label: 'Consulta General', description: 'Otras preguntas o solicitudes' },
  { value: 'ONBOARDING', label: 'Onboarding', description: 'Ayuda con el proceso de registro en Hacienda' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Baja', description: 'No es urgente' },
  { value: 'MEDIUM', label: 'Media', description: 'Necesito ayuda pronto' },
  { value: 'HIGH', label: 'Alta', description: 'Afecta mi operacion' },
  { value: 'URGENT', label: 'Urgente', description: 'Necesito ayuda inmediata' },
];

export function HelpRequestModal({
  open,
  onOpenChange,
  defaultType = 'GENERAL',
  contextData,
}: HelpRequestModalProps) {
  const [type, setType] = useState(defaultType);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Por favor ingresa un asunto');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');

      const metadata = contextData ? JSON.stringify(contextData) : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support-tickets`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            subject,
            description,
            priority,
            metadata,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al crear el ticket');
      }

      const ticket = await res.json();
      setTicketNumber(ticket.ticketNumber);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
      // Reset form after close animation
      setTimeout(() => {
        setSuccess(false);
        setTicketNumber('');
        setSubject('');
        setDescription('');
        setPriority('MEDIUM');
        setError('');
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl mb-2">Solicitud Enviada</DialogTitle>
            <DialogDescription className="mb-4">
              Tu solicitud ha sido recibida. Te contactaremos pronto.
            </DialogDescription>
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Numero de ticket</p>
              <p className="text-lg font-mono font-bold text-primary">{ticketNumber}</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Solicitar Ayuda
              </DialogTitle>
              <DialogDescription>
                Describe tu problema o consulta y nuestro equipo te asistira lo antes posible.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de solicitud</label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div>
                          <div className="font-medium">{t.label}</div>
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Asunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Describe brevemente tu problema"
                  className="input-rc"
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripcion (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Proporciona mas detalles sobre tu problema o consulta..."
                  rows={4}
                  className="input-rc"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prioridad</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div>
                          <div className="font-medium">{p.label}</div>
                          <div className="text-xs text-muted-foreground">{p.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !subject.trim()}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Solicitud'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
