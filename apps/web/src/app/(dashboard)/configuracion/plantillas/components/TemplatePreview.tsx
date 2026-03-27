'use client';

import * as React from 'react';
import { FileDown, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadPreviewPdf } from '../hooks/useTemplatePreview';

interface TemplatePreviewProps {
  previewHtml: string;
  templateId: string;
}

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
            <p className="text-sm font-medium">Error al renderizar la vista previa</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onRetry();
              }}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reintentar
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function TemplatePreview({ previewHtml, templateId }: TemplatePreviewProps) {
  const [downloading, setDownloading] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadPreviewPdf(templateId);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b bg-card flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Vista previa</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="gap-1.5"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileDown className="w-3.5 h-3.5" />
          )}
          Preview PDF
        </Button>
      </div>

      {/* Paper preview */}
      <PreviewErrorBoundary onRetry={() => setRetryKey((k) => k + 1)}>
        <div className="flex-1 overflow-auto p-6 flex justify-center">
          <div
            className="bg-white shadow-xl rounded-sm"
            style={{
              width: '612px',
              minHeight: '792px',
              maxWidth: '100%',
            }}
          >
            {previewHtml ? (
              <iframe
                key={retryKey}
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                style={{ minHeight: '792px' }}
                title="Vista previa de plantilla"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </PreviewErrorBoundary>
    </div>
  );
}
