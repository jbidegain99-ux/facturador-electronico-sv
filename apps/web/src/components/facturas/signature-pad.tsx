'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

interface SignatureCanvasRef {
  clear: () => void;
  toDataURL: () => string;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigRef = useRef<SignatureCanvasRef | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Dynamically import react-signature-canvas to avoid SSR issues
    import('react-signature-canvas').then((mod) => {
      const SignatureCanvas = mod.default;
      if (!containerRef.current) return;

      // Clear container and mount canvas
      containerRef.current.innerHTML = '';
      const canvas = document.createElement('div');
      containerRef.current.appendChild(canvas);

      // We need React to render it — use a simpler approach with a flag
      setLoaded(true);
    });
  }, []);

  const handleEnd = useCallback(() => {
    if (sigRef.current) {
      onSignatureChange(sigRef.current.toDataURL());
    }
  }, [onSignatureChange]);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onSignatureChange(null);
  }, [onSignatureChange]);

  // Use a simple canvas fallback that works without type issues
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
      <div ref={containerRef} className="rounded-lg border border-border bg-background">
        {!loaded && <div className="h-40 animate-pulse rounded-lg bg-muted" />}
        {loaded && <SignatureCanvasLazy sigRef={sigRef} onEnd={handleEnd} />}
      </div>
      <p className="text-xs text-muted-foreground">Firme con el dedo en el recuadro</p>
    </div>
  );
}

/** Inner component loaded only after dynamic import check */
function SignatureCanvasLazy({
  sigRef,
  onEnd,
}: {
  sigRef: React.MutableRefObject<SignatureCanvasRef | null>;
  onEnd: () => void;
}) {
  const [SigCanvas, setSigCanvas] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    import('react-signature-canvas').then((mod) => {
      setSigCanvas(() => mod.default);
    });
  }, []);

  if (!SigCanvas) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;

  return (
    <SigCanvas
      ref={(ref: unknown) => { sigRef.current = ref as SignatureCanvasRef; }}
      canvasProps={{
        className: 'w-full h-40 rounded-lg',
        style: { width: '100%', height: '160px' },
      }}
      onEnd={onEnd}
    />
  );
}
