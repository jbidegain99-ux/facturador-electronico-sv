'use client';

import { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Eraser } from 'lucide-react';

const SignatureCanvas = dynamic(() => import('react-signature-canvas'), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-lg bg-muted" />,
});

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const sigRef = useRef<{ clear: () => void; toDataURL: () => string } | null>(null);

  const handleEnd = useCallback(() => {
    if (sigRef.current) {
      onSignatureChange(sigRef.current.toDataURL());
    }
  }, [onSignatureChange]);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onSignatureChange(null);
  }, [onSignatureChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Firma</label>
        <button
          onClick={handleClear}
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Eraser className="h-3 w-3" />
          Borrar
        </button>
      </div>
      <div className="rounded-lg border border-border bg-background">
        <SignatureCanvas
          ref={(ref: unknown) => { sigRef.current = ref as typeof sigRef.current; }}
          canvasProps={{
            className: 'w-full h-40 rounded-lg',
            style: { width: '100%', height: '160px' },
          }}
          onEnd={handleEnd}
        />
      </div>
      <p className="text-xs text-muted-foreground">Firme con el dedo en el recuadro</p>
    </div>
  );
}
