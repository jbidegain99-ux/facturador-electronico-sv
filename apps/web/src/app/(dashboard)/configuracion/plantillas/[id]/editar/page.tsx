'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EditorSidebar } from '../../components/EditorSidebar';
import { TemplatePreview } from '../../components/TemplatePreview';
import { useTemplateConfig } from '../../hooks/useTemplateConfig';
import { useTemplatePreview } from '../../hooks/useTemplatePreview';
import type { InvoiceTemplate } from '../../lib/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditarPlantillaPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = React.useState<InvoiceTemplate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load template data
  React.useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/invoice-templates/${templateId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!res.ok) throw new Error('Plantilla no encontrada');
        const data = await res.json();
        setTemplate(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar plantilla');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  const {
    config,
    saveStatus,
    updateColor,
    updateFont,
    toggleSection,
    updateLogoPosition,
    resetColors,
    reorderSections,
    updatePageSettings,
  } = useTemplateConfig(templateId, template?.config);

  const { previewHtml } = useTemplatePreview(template?.htmlTemplate, config);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-[400px] p-4 space-y-4 border-r">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="flex-1 p-6 flex justify-center">
          <Skeleton className="w-[612px] h-[792px]" />
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive mb-4">{error || 'Plantilla no encontrada'}</p>
        <Button variant="outline" onClick={() => router.push('/configuracion/plantillas')}>
          Volver
        </Button>
      </div>
    );
  }

  if (template.isSystem) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Las plantillas del sistema no se pueden editar directamente.
          Clona una plantilla desde la página de selección para personalizarla.
        </p>
        <Button variant="outline" onClick={() => router.push('/configuracion/plantillas')}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Back button overlay */}
      <div className="absolute top-2 left-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/configuracion/plantillas')}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </div>

      {/* Sidebar with editor controls */}
      <EditorSidebar
        config={config}
        saveStatus={saveStatus}
        onColorChange={updateColor}
        onFontChange={updateFont}
        onToggleSection={toggleSection}
        onReorderSections={reorderSections}
        onLogoPositionChange={updateLogoPosition}
        onResetColors={resetColors}
        onPageSettingsChange={updatePageSettings}
      />

      {/* Preview */}
      <TemplatePreview previewHtml={previewHtml} templateId={templateId} />
    </div>
  );
}
