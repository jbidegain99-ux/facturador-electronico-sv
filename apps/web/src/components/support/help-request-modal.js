'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpRequestModal = HelpRequestModal;
const react_1 = require("react");
const dialog_1 = require("@/components/ui/dialog");
const select_1 = require("@/components/ui/select");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
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
function HelpRequestModal({ open, onOpenChange, defaultType = 'GENERAL', contextData, }) {
    const [type, setType] = (0, react_1.useState)(defaultType);
    const [subject, setSubject] = (0, react_1.useState)('');
    const [description, setDescription] = (0, react_1.useState)('');
    const [priority, setPriority] = (0, react_1.useState)('MEDIUM');
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [success, setSuccess] = (0, react_1.useState)(false);
    const [ticketNumber, setTicketNumber] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)('');
    const handleSubmit = async (e) => {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support-tickets`, {
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
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Error al crear el ticket');
            }
            const ticket = await res.json();
            setTicketNumber(ticket.ticketNumber);
            setSuccess(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar la solicitud');
        }
        finally {
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
    return (<dialog_1.Dialog open={open} onOpenChange={handleClose}>
      <dialog_1.DialogContent className="sm:max-w-[500px]">
        {success ? (<div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <lucide_react_1.CheckCircle className="w-8 h-8 text-green-500"/>
            </div>
            <dialog_1.DialogTitle className="text-xl mb-2">Solicitud Enviada</dialog_1.DialogTitle>
            <dialog_1.DialogDescription className="mb-4">
              Tu solicitud ha sido recibida. Te contactaremos pronto.
            </dialog_1.DialogDescription>
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Numero de ticket</p>
              <p className="text-lg font-mono font-bold text-primary">{ticketNumber}</p>
            </div>
            <button_1.Button onClick={handleClose} className="w-full">
              Cerrar
            </button_1.Button>
          </div>) : (<>
            <dialog_1.DialogHeader>
              <dialog_1.DialogTitle className="flex items-center gap-2">
                <lucide_react_1.HelpCircle className="w-5 h-5 text-primary"/>
                Solicitar Ayuda
              </dialog_1.DialogTitle>
              <dialog_1.DialogDescription>
                Describe tu problema o consulta y nuestro equipo te asistira lo antes posible.
              </dialog_1.DialogDescription>
            </dialog_1.DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de solicitud</label>
                <select_1.Select value={type} onValueChange={(val) => setType(val)}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue />
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {ticketTypes.map((t) => (<select_1.SelectItem key={t.value} value={t.value}>
                        <div>
                          <div className="font-medium">{t.label}</div>
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        </div>
                      </select_1.SelectItem>))}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Asunto</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Describe brevemente tu problema" className="input-rc" maxLength={255}/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripcion (opcional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Proporciona mas detalles sobre tu problema o consulta..." rows={4} className="input-rc"/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prioridad</label>
                <select_1.Select value={priority} onValueChange={setPriority}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue />
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {priorityOptions.map((p) => (<select_1.SelectItem key={p.value} value={p.value}>
                        <div>
                          <div className="font-medium">{p.label}</div>
                          <div className="text-xs text-muted-foreground">{p.description}</div>
                        </div>
                      </select_1.SelectItem>))}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              {error && (<div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                  {error}
                </div>)}

              <div className="flex gap-3 pt-4">
                <button_1.Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="flex-1">
                  Cancelar
                </button_1.Button>
                <button_1.Button type="submit" disabled={submitting || !subject.trim()} className="flex-1">
                  {submitting ? (<>
                      <lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                      Enviando...
                    </>) : ('Enviar Solicitud')}
                </button_1.Button>
              </div>
            </form>
          </>)}
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
