'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Paintbrush, Type, LayoutList, Settings2 } from 'lucide-react';
import { BrandingTab } from './BrandingTab';
import { TypographyTab } from './TypographyTab';
import { SectionsTab } from './SectionsTab';
import { AdvancedTab } from './AdvancedTab';
import { SaveIndicator } from './SaveIndicator';
import type { TemplateConfig, SectionConfig } from '../lib/constants';
import type { SaveStatus } from '../hooks/useTemplateConfig';

interface EditorSidebarProps {
  config: TemplateConfig;
  saveStatus: SaveStatus;
  onColorChange: (key: string, value: string) => void;
  onFontChange: (key: 'heading' | 'body', value: string) => void;
  onToggleSection: (key: string) => void;
  onReorderSections: (sections: Record<string, SectionConfig>) => void;
  onLogoPositionChange: (position: 'left' | 'center' | 'right') => void;
  onResetColors: () => void;
  onPageSettingsChange: (settings: Partial<TemplateConfig['pageSettings']>) => void;
}

export function EditorSidebar({
  config,
  saveStatus,
  onColorChange,
  onFontChange,
  onToggleSection,
  onReorderSections,
  onLogoPositionChange,
  onResetColors,
  onPageSettingsChange,
}: EditorSidebarProps) {
  return (
    <div className="w-[400px] shrink-0 border-r bg-card overflow-y-auto h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Personalizar Plantilla</h3>
        <SaveIndicator status={saveStatus} />
      </div>

      <Tabs defaultValue="marca" className="p-4">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="marca" className="gap-1 text-xs">
            <Paintbrush className="w-3.5 h-3.5" />
            Marca
          </TabsTrigger>
          <TabsTrigger value="tipografia" className="gap-1 text-xs">
            <Type className="w-3.5 h-3.5" />
            Fuentes
          </TabsTrigger>
          <TabsTrigger value="secciones" className="gap-1 text-xs">
            <LayoutList className="w-3.5 h-3.5" />
            Secciones
          </TabsTrigger>
          <TabsTrigger value="avanzado" className="gap-1 text-xs">
            <Settings2 className="w-3.5 h-3.5" />
            Avanzado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marca">
          <BrandingTab
            config={config}
            onColorChange={onColorChange}
            onLogoPositionChange={onLogoPositionChange}
            onResetColors={onResetColors}
          />
        </TabsContent>

        <TabsContent value="tipografia">
          <TypographyTab config={config} onFontChange={onFontChange} />
        </TabsContent>

        <TabsContent value="secciones">
          <SectionsTab
            config={config}
            onToggleSection={onToggleSection}
            onReorderSections={onReorderSections}
          />
        </TabsContent>

        <TabsContent value="avanzado">
          <AdvancedTab
            config={config}
            onPageSettingsChange={onPageSettingsChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
