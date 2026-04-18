'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import type { ReceivedDteDetail } from '@/types/purchase';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ImportDteManualModal({ open, onOpenChange }: Props) {
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const dte = await apiFetch<ReceivedDteDetail>('/received-dtes', {
        method: 'POST',
        body: JSON.stringify({ content, format: 'json' }),
      });
      toast.success('DTE importado y persistido');
      onOpenChange(false);
      setContent('');
      router.push(`/compras/recibidos/${dte.id}`);
    } catch (err) {
      const anyErr = err as { code?: string; existingId?: string; message?: string };
      if (anyErr.code === 'DUPLICATE' && anyErr.existingId) {
        toast.info('Este DTE ya existe. Abriendo el existente...');
        onOpenChange(false);
        router.push(`/compras/recibidos/${anyErr.existingId}`);
      } else if (anyErr.code === 'FORMAT_NOT_SUPPORTED') {
        toast.error('Solo formato JSON disponible en esta versión');
      } else if (anyErr.code === 'INVALID_JSON') {
        toast.error('JSON inválido. Revisa el contenido.');
      } else {
        toast.error(anyErr.message ?? 'Error importando');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Importar DTE (persistir en cola)</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Pega el JSON del DTE:</Label>
          <Textarea
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='{"identificacion":{...},"emisor":{...},"receptor":{...},"cuerpoDocumento":[...],"resumen":{...}}'
          />
          <p className="text-xs text-muted-foreground">Este DTE se guardará en la bandeja DTEs recibidos. Puedes convertirlo a Compra después.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || content.trim().length < 10}>
            {submitting ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
