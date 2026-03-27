'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import { TemplateCard } from './components/TemplateCard';
import { useTemplates } from './hooks/useTemplates';

export default function PlantillasPage() {
  const router = useRouter();
  const { templates, loading, error, fetchTemplates, cloneTemplate, setDefault } = useTemplates();
  const { hasFeature, loading: planLoading } = usePlanFeatures();
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const canCustomize = hasFeature('custom_templates');

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSetDefault = async (id: string) => {
    setActionLoading(id);
    await setDefault(id);
    setActionLoading(null);
  };

  const handleCustomize = async (template: { id: string; isSystem: boolean; slug: string }) => {
    if (!canCustomize) return;

    setActionLoading(template.id);

    if (template.isSystem) {
      // Clone system template, then navigate to editor
      const cloned = await cloneTemplate(template.id, `${template.slug} personalizada`);
      if (cloned) {
        router.push(`/configuracion/plantillas/${cloned.id}/editar`);
      }
    } else {
      // Already a tenant template, go directly to editor
      router.push(`/configuracion/plantillas/${template.id}/editar`);
    }
    setActionLoading(null);
  };

  // Find active template
  const activeTemplate = templates.find((t) => t.isDefault && !t.isSystem);
  const activeSystemSlug = activeTemplate?.parentId
    ? templates.find((t) => t.id === activeTemplate.parentId)?.slug
    : null;

  if (loading || planLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const systemTemplates = templates.filter((t) => t.isSystem);
  const tenantTemplates = templates.filter((t) => !t.isSystem);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/configuracion')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Plantillas de Factura
          </h1>
          <p className="text-sm text-muted-foreground">
            Elige y personaliza el diseño de tus facturas PDF
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {/* System templates grid */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Plantillas disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {systemTemplates.map((template) => {
            // Check if this system template is the active one (directly or via clone)
            const isActive = template.isDefault ||
              activeSystemSlug === template.slug ||
              (activeTemplate?.parentId === template.id);

            return (
              <TemplateCard
                key={template.id}
                template={template}
                isActive={isActive}
                canCustomize={canCustomize}
                onSetDefault={() => handleSetDefault(template.id)}
                onCustomize={() => handleCustomize(template)}
                loading={actionLoading === template.id}
              />
            );
          })}
        </div>
      </div>

      {/* Tenant custom templates */}
      {tenantTemplates.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Mis plantillas personalizadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tenantTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isActive={template.isDefault}
                canCustomize={canCustomize}
                onSetDefault={() => handleSetDefault(template.id)}
                onCustomize={() => handleCustomize(template)}
                loading={actionLoading === template.id}
              />
            ))}
          </div>
        </div>
      )}

      {!canCustomize && (
        <div className="text-center py-6 border border-dashed rounded-lg">
          <Palette className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Personalización de plantillas</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Cambia colores, fuentes y secciones con el Plan Professional
          </p>
          <Button variant="default" size="sm" onClick={() => router.push('/configuracion/plan')}>
            Ver planes
          </Button>
        </div>
      )}
    </div>
  );
}
